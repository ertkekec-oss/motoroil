"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';
import { useFinancials } from '@/contexts/FinancialContext';

function PaymentContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { showSuccess, showError } = useModal();
    const { kasalar, addFinancialTransaction, salesExpenses } = useFinancials();

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
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [selectedAccount, setSelectedAccount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [installment, setInstallment] = useState(1);

    // Get available installment options from settings
    const availableInstallments = salesExpenses?.posCommissions || [];
    const installmentOptions = [
        { value: 1, label: 'Tek Çekim' },
        ...availableInstallments
            .filter((comm: any) => comm.installment && comm.installment !== 'Tek Çekim')
            .map((comm: any) => {
                const match = comm.installment.match(/(\d+)/);
                const value = match ? parseInt(match[1]) : null;
                return value ? { value, label: comm.installment } : null;
            })
            .filter((opt: any) => opt !== null)
    ];

    useEffect(() => {
        if (kasalar.length > 0) {
            let defaultKasa;
            if (paymentMethod === 'cash') defaultKasa = kasalar.find(k => k.type === 'Nakit');
            else if (paymentMethod === 'cc') defaultKasa = kasalar.find(k => k.type === 'POS' || k.type === 'Kredi Kartı Tahsilat');
            else if (paymentMethod === 'iban') defaultKasa = kasalar.find(k => k.type === 'Banka');

            if (defaultKasa) setSelectedAccount(defaultKasa.id.toString());
            else if (kasalar.length > 0) setSelectedAccount(kasalar[0].id.toString());
        }
    }, [paymentMethod, kasalar]);

    const handlePayment = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            showError('Hata', 'Lütfen geçerli bir tutar giriniz.');
            return;
        }

        if (!selectedAccount) {
            showError('Hata', 'Lütfen işlem yapılacak Kasa veya Banka hesabını seçiniz.');
            return;
        }

        if (isProcessing) return;

        setIsProcessing(true);

        const timeoutId = setTimeout(() => {
            console.warn('Payment API timeout - resetting state');
            setIsProcessing(false);
            showError('Zaman Aşımı', 'İşlem çok uzun sürdü. Lütfen işlemin tamamlanıp tamamlanmadığını kontrol edin.');
        }, 10000);

        try {
            let description = `${title}`;
            if (paymentMethod === 'cash') description += ' (Nakit)';
            else if (paymentMethod === 'cc') {
                const instLabel = installmentOptions.find(opt => opt.value === installment)?.label || 'Tek Çekim';
                description += ` (Kredi Kartı - ${instLabel})`;
            }
            else if (paymentMethod === 'iban') description += ' (Havale/EFT)';

            const result = await addFinancialTransaction({
                type: paymentType === 'payable' ? 'Payment' : 'Collection',
                amount: parseFloat(amount),
                description: description,
                kasaId: selectedAccount,
                customerId: customerId,
                supplierId: supplierId
            });

            clearTimeout(timeoutId);
            setIsProcessing(false);

            if (result && result.success) {
                showSuccess('Başarılı', 'İşlem başarıyla tamamlandı!');
                const redirectUrl = supplierId ? '/suppliers' : customerId ? `/customers/${customerId}` : '/';
                setTimeout(() => router.push(redirectUrl), 500);
            } else {
                const errMsg = result?.error || 'Bilinmeyen hata';
                showError('Hata', errMsg);
            }
        } catch (error) {
            console.error('Payment exception:', error);
            clearTimeout(timeoutId);
            setIsProcessing(false);
            showError('Hata', 'Sistem hatası oluştu. Lütfen tekrar deneyin.');
        }
    };

    const paymentMethods = [
        { id: 'cash', icon: '💵', label: 'Nakit', color: '#10b981' },
        { id: 'cc', icon: '💳', label: 'Kredi Kartı', color: '#3b82f6' },
        { id: 'iban', icon: '🏦', label: 'Havale/EFT', color: '#f59e0b' }
    ];

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            background: 'var(--bg-app, #080a0f)'
        }}>
            <div style={{
                maxWidth: '1200px',
                width: '100%',
                padding: '48px',
                background: 'var(--bg-card, #0f172a)',
                borderRadius: '24px',
                border: '1px solid var(--border-color, rgba(255,255,255,0.05))',
                boxShadow: '0 24px 60px rgba(0,0,0,0.2)'
            }} className="animate-scale-in">
                {/* Header */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '40px',
                    borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))',
                    paddingBottom: '32px'
                }}>
                    <div style={{
                        fontSize: '12px',
                        color: paymentType === 'payable' ? '#ef4444' : '#10b981',
                        textTransform: 'uppercase',
                        letterSpacing: '3px',
                        fontWeight: '800',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}>
                        <span style={{ fontSize: '18px' }}>{paymentType === 'payable' ? '💸' : '💰'}</span>
                        {paymentType === 'payable' ? 'ÖDEME İŞLEMİ' : 'TAHSİLAT İŞLEMİ'}
                    </div>
                    <div style={{
                        fontSize: '14px',
                        color: 'var(--text-muted, #94a3b8)',
                        fontWeight: '500',
                        background: 'var(--bg-panel, rgba(255,255,255,0.03))',
                        display: 'inline-flex',
                        padding: '8px 16px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color, rgba(255,255,255,0.05))'
                    }}>
                        <span style={{ color: '#3b82f6', fontWeight: '800', marginRight: '8px' }}>#{refId}</span> {title}
                    </div>
                </div>

                {/* Main Content - Horizontal Layout */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '24px',
                    marginBottom: '40px'
                }}>
                    {/* Left: Amount */}
                    <div style={{
                        background: 'var(--bg-panel, rgba(255,255,255,0.02))',
                        padding: '32px',
                        borderRadius: '20px',
                        border: '1px solid var(--border-color, rgba(255,255,255,0.05))',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                    }}>
                        <label style={{
                            fontSize: '11px',
                            display: 'block',
                            marginBottom: '16px',
                            color: 'var(--text-muted, #64748b)',
                            letterSpacing: '2px',
                            fontWeight: '800'
                        }}>
                            İŞLEM TUTARI
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '40px', fontWeight: '900', color: '#3b82f6' }}>₺</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-main, #fff)',
                                    fontSize: '56px',
                                    fontWeight: '900',
                                    width: '100%',
                                    outline: 'none',
                                    fontFamily: 'monospace',
                                    letterSpacing: '-2px'
                                }}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Middle: Payment Method */}
                    <div style={{
                        background: 'var(--bg-panel, rgba(255,255,255,0.02))',
                        padding: '32px',
                        borderRadius: '20px',
                        border: '1px solid var(--border-color, rgba(255,255,255,0.05))'
                    }}>
                        <label style={{
                            fontSize: '11px',
                            display: 'block',
                            marginBottom: '16px',
                            color: 'var(--text-muted, #64748b)',
                            letterSpacing: '2px',
                            fontWeight: '800'
                        }}>
                            ÖDEME YÖNTEMİ
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {paymentMethods.map(method => (
                                <button
                                    key={method.id}
                                    onClick={() => setPaymentMethod(method.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        padding: '16px 20px',
                                        cursor: 'pointer',
                                        borderRadius: '16px',
                                        border: paymentMethod === method.id
                                            ? `2px solid ${method.color}`
                                            : '1px solid var(--border-color, rgba(255,255,255,0.05))',
                                        background: paymentMethod === method.id
                                            ? `${method.color}10`
                                            : 'var(--bg-card, rgba(255,255,255,0.02))',
                                        transition: 'all 0.2s',
                                        position: 'relative'
                                    }}
                                    className="hover:-translate-y-1 hover:shadow-sm"
                                >
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '12px',
                                        background: paymentMethod === method.id ? method.color : 'var(--bg-panel, rgba(255,255,255,0.05))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '20px', transition: 'all 0.2s'
                                    }}>
                                        {method.icon}
                                    </div>
                                    <span style={{
                                        fontSize: '15px',
                                        fontWeight: '700',
                                        color: 'var(--text-main, #fff)',
                                        flex: 1,
                                        textAlign: 'left'
                                    }}>
                                        {method.label}
                                    </span>
                                    {paymentMethod === method.id && (
                                        <div style={{
                                            width: '24px', height: '24px', borderRadius: '50%', background: method.color, color: '#fff',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold'
                                        }}>
                                            ✓
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Account Selection */}
                    <div style={{
                        background: 'var(--bg-panel, rgba(255,255,255,0.02))',
                        padding: '32px',
                        borderRadius: '20px',
                        border: '1px solid var(--border-color, rgba(255,255,255,0.05))'
                    }}>
                        <label style={{
                            fontSize: '11px',
                            display: 'block',
                            marginBottom: '16px',
                            color: 'var(--text-muted, #64748b)',
                            letterSpacing: '2px',
                            fontWeight: '800'
                        }}>
                            HEDEF KASA/BANKA
                        </label>
                        <select
                            value={selectedAccount}
                            onChange={(e) => setSelectedAccount(e.target.value)}
                            style={{
                                width: '100%',
                                background: 'var(--bg-card, rgba(255,255,255,0.05))',
                                color: 'var(--text-main, #fff)',
                                border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                                padding: '16px 20px',
                                borderRadius: '14px',
                                cursor: 'pointer',
                                fontSize: '15px',
                                fontWeight: '700',
                                marginBottom: '24px',
                                outline: 'none'
                            }}
                            className="focus:border-blue-500 focus:bg-blue-500/5 transition-all"
                        >
                            {paymentMethod === 'cash' && kasalar.filter(k => k.type === 'Nakit').map(c => (
                                <option key={c.id} value={c.id} style={{ background: '#0f172a' }}>{c.name}</option>
                            ))}
                            {paymentMethod === 'cc' && kasalar.filter(k => k.type === 'POS' || k.type === 'Kredi Kartı Tahsilat').map(p => (
                                <option key={p.id} value={p.id} style={{ background: '#0f172a' }}>{p.name}</option>
                            ))}
                            {paymentMethod === 'iban' && kasalar.filter(k => k.type === 'Banka').map(b => (
                                <option key={b.id} value={b.id} style={{ background: '#0f172a' }}>{b.name}</option>
                            ))}
                        </select>

                        {/* Installments for Credit Card */}
                        {paymentMethod === 'cc' && (
                            <div>
                                <label style={{
                                    fontSize: '11px',
                                    display: 'block',
                                    marginBottom: '12px',
                                    color: 'var(--text-muted, #64748b)',
                                    letterSpacing: '2px',
                                    fontWeight: '800'
                                }}>
                                    TAKSİT
                                </label>
                                {installmentOptions.length === 0 ? (
                                    <div style={{
                                        padding: '16px',
                                        textAlign: 'center',
                                        color: '#ef4444',
                                        fontSize: '13px',
                                        fontWeight: '700',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                        borderRadius: '12px'
                                    }}>
                                        ⚠️ Taksit tanımı yok
                                    </div>
                                ) : (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(3, 1fr)',
                                        gap: '8px'
                                    }}>
                                        {installmentOptions.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setInstallment(opt.value)}
                                                style={{
                                                    padding: '12px 8px',
                                                    borderRadius: '12px',
                                                    border: installment === opt.value
                                                        ? '2px solid #3b82f6'
                                                        : '1px solid var(--border-color, rgba(255,255,255,0.05))',
                                                    background: installment === opt.value
                                                        ? 'rgba(59, 130, 246, 0.1)'
                                                        : 'var(--bg-card, rgba(255,255,255,0.02))',
                                                    color: installment === opt.value ? '#3b82f6' : 'var(--text-main, #fff)',
                                                    fontWeight: '700',
                                                    fontSize: '13px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    textAlign: 'center'
                                                }}
                                                className="hover:border-blue-500/50"
                                            >
                                                {opt.value === 1 ? 'Tek Çekim' : `${opt.value} Taksit`}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'space-between', paddingTop: '24px', borderTop: '1px solid var(--border-color, rgba(255,255,255,0.05))' }}>
                    <button
                        onClick={() => router.back()}
                        disabled={isProcessing}
                        style={{
                            padding: '16px 32px',
                            borderRadius: '16px',
                            fontSize: '15px',
                            fontWeight: '800',
                            background: 'var(--bg-panel, rgba(255,255,255,0.05))',
                            color: 'var(--text-main, #fff)',
                            border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            opacity: isProcessing ? 0.5 : 1,
                            transition: 'all 0.2s'
                        }}
                        className="hover:bg-white/10"
                    >
                        ← Geri Dön
                    </button>
                    <button
                        onClick={handlePayment}
                        disabled={isProcessing}
                        style={{
                            flex: 1,
                            maxWidth: '60%',
                            padding: '16px',
                            fontSize: '16px',
                            fontWeight: '900',
                            background: paymentType === 'payable' ? '#ef4444' : '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '16px',
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            opacity: isProcessing ? 0.8 : 1,
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            boxShadow: `0 8px 32px ${paymentType === 'payable' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`
                        }}
                        className="hover:-translate-y-1 hover:shadow-sm"
                    >
                        {isProcessing ? (
                            <>
                                <span className="loader" style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                                İŞLENİYOR...
                            </>
                        ) : paymentType === 'payable' ? (
                            <>💸 ONAYLA VE ÖDEMEYİ YAP</>
                        ) : (
                            <>💰 ONAYLA VE TAHSİLATI AL</>
                        )}
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
