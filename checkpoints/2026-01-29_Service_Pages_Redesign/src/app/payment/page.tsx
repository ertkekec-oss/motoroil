
"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';

function PaymentContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { showSuccess, showError } = useModal();

    const refId = searchParams.get('ref') || 'GENEL';
    const initialAmount = searchParams.get('amount') || '0';
    const title = searchParams.get('title') || 'Genel İşlem';
    const typeParam = searchParams.get('type') || 'income';
    const paymentType = (typeParam === 'payment' || typeParam === 'payable') ? 'payable' : 'income';
    const customerId = searchParams.get('customerId') ||
        (refId.includes('cust-') ? refId.split('cust-')[1] :
            refId.startsWith('CUST-') ? refId.split('-')[1] : undefined);

    const supplierId = searchParams.get('supplierId') ||
        (refId.includes('sup-') ? refId.split('sup-')[1] :
            refId.startsWith('SUP-') ? refId.split('-')[1] : undefined);

    const [amount, setAmount] = useState(initialAmount);
    const [paymentMethod, setPaymentMethod] = useState('cash'); // cash, cc, iban, account
    const { kasalar, addFinancialTransaction } = useApp();
    const [selectedAccount, setSelectedAccount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Credit Card Installments
    const [installment, setInstallment] = useState(1);

    useEffect(() => {
        if (kasalar.length > 0) {
            let defaultKasa;
            if (paymentMethod === 'cash') defaultKasa = kasalar.find(k => k.type === 'Nakit');
            else if (paymentMethod === 'cc' || paymentMethod === 'iban') defaultKasa = kasalar.find(k => k.type === 'Banka');
            // If 'account', no kasa is needed, but we keep state clean.

            if (defaultKasa) setSelectedAccount(defaultKasa.id.toString());
            else if (kasalar.length > 0) setSelectedAccount(kasalar[0].id.toString());
        }
    }, [paymentMethod, kasalar]);

    const handlePayment = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            showError('Hata', 'Geçerli bir tutar giriniz.');
            return;
        }

        // If not 'account' (veresiye), we need a kasa/bank
        if (paymentMethod !== 'account' && !selectedAccount) {
            showError('Hata', 'Lütfen işlem yapılacak Kasa veya Banka hesabını seçiniz.');
            return;
        }

        if (isProcessing) return;

        setIsProcessing(true);
        try {
            let description = `${title}`;
            if (paymentMethod === 'cash') description += ' (Nakit)';
            else if (paymentMethod === 'cc') description += ` (Kredi Kartı - ${installment > 1 ? installment + ' Taksit' : 'Tek Çekim'})`;
            else if (paymentMethod === 'iban') description += ' (Havale/EFT)';
            else if (paymentMethod === 'account') description += ' (Cari Hesaba İşlendi / Veresiye)';

            const result = await addFinancialTransaction({
                type: paymentType === 'payable' ? 'Payment' : 'Collection',
                amount: parseFloat(amount),
                description: description,
                kasaId: paymentMethod === 'account' ? undefined : selectedAccount, // No kasa for account/veresiye
                customerId: customerId,
                supplierId: supplierId,
                isAccountTransaction: paymentMethod === 'account' // Special flag for hook to handle balance only
            });

            if (result && result.success) {
                showSuccess('Başarılı', `✅ İşlem Başarılı!\nKayıt tamamlandı.`);
                router.push(supplierId ? '/suppliers' : customerId ? `/customers/${customerId}` : '/');
            } else {
                showError('Hata', '❌ Hata: İşlem kaydedilemedi. ' + (result?.error || ''));
            }
        } catch (error) {
            console.error('Payment error:', error);
            showError('Hata', '❌ Bir sistem hatası oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="container" style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto' }}>
            <div className="card glass">
                <header style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {paymentType === 'payable' ? 'ÖDEME YAPILIYOR' : 'ÖDEME ALINIYOR'}
                    </div>
                    <h1 className="text-gradient" style={{ fontSize: '32px', margin: '8px 0' }}>Tahsilat Ekranı</h1>
                    <div style={{ fontSize: '14px', color: 'var(--primary)' }}>Ref: #{refId}</div>
                    <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>{title}</div>
                </header>

                <div className="flex-col gap-6">

                    {/* Tutar Alanı */}
                    <div style={{ textAlign: 'center', background: 'var(--bg-deep)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
                        <label style={{ fontSize: '12px', display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>TUTAR</label>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '32px', fontWeight: 'bold' }}>₺</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                style={{
                                    background: 'transparent', border: 'none', color: 'white',
                                    fontSize: '48px', fontWeight: 'bold', width: '200px', textAlign: 'center', outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    {/* Ödeme Yöntemleri */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {/* Row 1 */}
                        <button
                            onClick={() => setPaymentMethod('cash')}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                padding: '20px', cursor: 'pointer', borderRadius: '12px',
                                border: paymentMethod === 'cash' ? '2px solid var(--success)' : '1px solid var(--border-light)',
                                background: paymentMethod === 'cash' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                transition: 'all 0.2s', minHeight: '100px'
                            }}
                        >
                            <span style={{ fontSize: '28px' }}>💵</span>
                            <span style={{ fontSize: '13px', marginTop: '8px', color: 'white' }}>Nakit</span>
                        </button>
                        <button
                            onClick={() => setPaymentMethod('cc')}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                padding: '20px', cursor: 'pointer', borderRadius: '12px',
                                border: paymentMethod === 'cc' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                                background: paymentMethod === 'cc' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                transition: 'all 0.2s', minHeight: '100px'
                            }}
                        >
                            <span style={{ fontSize: '28px' }}>💳</span>
                            <span style={{ fontSize: '13px', marginTop: '8px', color: 'white' }}>Kredi Kartı</span>
                        </button>

                        {/* Row 2 */}
                        <button
                            onClick={() => setPaymentMethod('iban')}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                padding: '20px', cursor: 'pointer', borderRadius: '12px',
                                border: paymentMethod === 'iban' ? '2px solid #F59E0B' : '1px solid var(--border-light)',
                                background: paymentMethod === 'iban' ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                                transition: 'all 0.2s', minHeight: '100px'
                            }}
                        >
                            <span style={{ fontSize: '28px' }}>🏦</span>
                            <span style={{ fontSize: '13px', marginTop: '8px', color: 'white' }}>Havale / EFT</span>
                        </button>
                        <button
                            onClick={() => setPaymentMethod('account')}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                padding: '20px', cursor: 'pointer', borderRadius: '12px',
                                border: paymentMethod === 'account' ? '2px solid #EC4899' : '1px solid var(--border-light)',
                                background: paymentMethod === 'account' ? 'rgba(236, 72, 153, 0.1)' : 'transparent',
                                transition: 'all 0.2s', minHeight: '100px'
                            }}
                        >
                            <span style={{ fontSize: '28px' }}>📖</span>
                            <span style={{ fontSize: '13px', marginTop: '8px', color: 'white' }}>Cari Hesaba At (Veresiye)</span>
                        </button>
                    </div>

                    {/* Kredi Kartı Taksit Seçenekleri */}
                    {paymentMethod === 'cc' && (
                        <div className="flex-col gap-2 animate-fade-in" style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid var(--primary)' }}>
                            <label className="text-muted" style={{ fontSize: '11px', color: '#ddd' }}>TAKSİT SEÇENEKLERİ</label>
                            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                                {[1, 2, 3, 6, 9, 12].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setInstallment(t)}
                                        style={{
                                            padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                            background: installment === t ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                            color: 'white', fontWeight: 'bold', fontSize: '13px'
                                        }}
                                    >
                                        {t === 1 ? 'Tek Çekim' : `${t} Taksit`}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Kasa/Banka Seçimi (Veresiye hariç) */}
                    {paymentMethod !== 'account' && (
                        <div className="flex-col gap-2 animate-fade-in" style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                            <label className="text-muted" style={{ fontSize: '11px' }}>HEDEF KASA / BANKA</label>
                            <select
                                value={selectedAccount}
                                onChange={(e) => setSelectedAccount(e.target.value)}
                                style={{ background: 'black', color: 'white', border: '1px solid var(--primary)', padding: '12px', borderRadius: '8px', cursor: 'pointer' }}
                            >
                                {paymentMethod === 'cash' && kasalar.filter(k => k.type === 'Nakit').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                {(paymentMethod === 'cc' || paymentMethod === 'iban') && kasalar.filter(k => k.type === 'Banka').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    )}

                    {paymentMethod === 'account' && (
                        <div className="flex-col gap-2 animate-fade-in" style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid #EC4899' }}>
                            <div style={{ fontSize: '13px', color: '#ffb3d9' }}>
                                ℹ️ Bu işlem kasaya para girişi yapmaz. Sadece müşterinin cari bakiyesine borç/alacak olarak işlenir.
                            </div>
                        </div>
                    )}

                    <div className="divider"></div>

                    {/* Bilgi Notu */}
                    <div className="flex-between">
                        <span className="text-muted">Kasiyer:</span>
                        <span>Yönetici (Siz)</span>
                    </div>

                    <button
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className="btn btn-primary w-full"
                        style={{ padding: '20px', fontSize: '18px', opacity: isProcessing ? 0.7 : 1, cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                    >
                        {isProcessing ? 'İŞLENİYOR...' : 'ONAYLA VE FİŞ KES'}
                    </button>
                    <button onClick={() => router.back()} disabled={isProcessing} className="btn btn-outline w-full" style={{ border: 'none' }}>
                        İptal Et
                    </button>

                </div>
            </div>
        </div>
    );
}

export default function PaymentPage() {
    return (
        <Suspense fallback={<div className="container flex-center" style={{ height: '100vh' }}>Yükleniyor...</div>}>
            <PaymentContent />
        </Suspense>
    );
}
