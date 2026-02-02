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
            padding: '20px'
        }}>
            <div className="card glass" style={{
                maxWidth: '1200px',
                width: '100%',
                padding: '40px'
            }}>
                {/* Header */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '32px',
                    borderBottom: '1px solid var(--border-light)',
                    paddingBottom: '24px'
                }}>
                    <div style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        fontWeight: '700',
                        marginBottom: '8px'
                    }}>
                        {paymentType === 'payable' ? '💸 ÖDEME YAPILIYOR' : '💰 TAHSİLAT YAPILIYOR'}
                    </div>
                    <h1 style={{
                        fontSize: '28px',
                        margin: '0 0 12px 0',
                        fontWeight: '800',
                        color: 'white'
                    }}>
                        {paymentType === 'payable' ? 'Ödeme İşlemi' : 'Tahsilat İşlemi'}
                    </h1>
                    <div style={{
                        fontSize: '13px',
                        color: 'var(--text-muted)'
                    }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>#{refId}</span> • {title}
                    </div>
                </div>

                {/* Main Content - Horizontal Layout */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '24px',
                    marginBottom: '32px'
                }}>
                    {/* Left: Amount */}
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: '24px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-light)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                    }}>
                        <label style={{
                            fontSize: '10px',
                            display: 'block',
                            marginBottom: '12px',
                            color: 'var(--text-muted)',
                            letterSpacing: '1.5px',
                            fontWeight: '700'
                        }}>
                            İŞLEM TUTARI
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary)' }}>₺</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '40px',
                                    fontWeight: '900',
                                    width: '100%',
                                    outline: 'none'
                                }}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Middle: Payment Method */}
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: '24px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-light)'
                    }}>
                        <label style={{
                            fontSize: '10px',
                            display: 'block',
                            marginBottom: '12px',
                            color: 'var(--text-muted)',
                            letterSpacing: '1.5px',
                            fontWeight: '700'
                        }}>
                            ÖDEME YÖNTEMİ
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {paymentMethods.map(method => (
                                <button
                                    key={method.id}
                                    onClick={() => setPaymentMethod(method.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px 16px',
                                        cursor: 'pointer',
                                        borderRadius: '8px',
                                        border: paymentMethod === method.id
                                            ? `2px solid ${method.color}`
                                            : '1px solid rgba(255,255,255,0.1)',
                                        background: paymentMethod === method.id
                                            ? 'rgba(255,255,255,0.1)'
                                            : 'transparent',
                                        transition: 'all 0.2s',
                                        position: 'relative'
                                    }}
                                >
                                    <span style={{ fontSize: '24px' }}>{method.icon}</span>
                                    <span style={{
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: 'white',
                                        flex: 1
                                    }}>
                                        {method.label}
                                    </span>
                                    {paymentMethod === method.id && (
                                        <span style={{
                                            fontSize: '16px',
                                            color: method.color
                                        }}>
                                            ✓
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Account Selection */}
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: '24px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-light)'
                    }}>
                        <label style={{
                            fontSize: '10px',
                            display: 'block',
                            marginBottom: '12px',
                            color: 'var(--text-muted)',
                            letterSpacing: '1.5px',
                            fontWeight: '700'
                        }}>
                            HEDEF KASA/BANKA
                        </label>
                        <select
                            value={selectedAccount}
                            onChange={(e) => setSelectedAccount(e.target.value)}
                            style={{
                                width: '100%',
                                background: 'rgba(0,0,0,0.3)',
                                color: 'white',
                                border: '1px solid var(--border-light)',
                                padding: '12px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '600',
                                marginBottom: '16px'
                            }}
                        >
                            {paymentMethod === 'cash' && kasalar.filter(k => k.type === 'Nakit').map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                            {paymentMethod === 'cc' && kasalar.filter(k => k.type === 'POS' || k.type === 'Kredi Kartı Tahsilat').map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                            {paymentMethod === 'iban' && kasalar.filter(k => k.type === 'Banka').map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>

                        {/* Installments for Credit Card */}
                        {paymentMethod === 'cc' && (
                            <div>
                                <label style={{
                                    fontSize: '10px',
                                    display: 'block',
                                    marginBottom: '8px',
                                    color: 'var(--text-muted)',
                                    letterSpacing: '1.5px',
                                    fontWeight: '700'
                                }}>
                                    TAKSİT
                                </label>
                                {installmentOptions.length === 0 ? (
                                    <div style={{
                                        padding: '12px',
                                        textAlign: 'center',
                                        color: 'var(--text-muted)',
                                        fontSize: '11px',
                                        background: 'rgba(255,0,0,0.1)',
                                        borderRadius: '6px'
                                    }}>
                                        ⚠️ Taksit tanımı yok
                                    </div>
                                ) : (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(3, 1fr)',
                                        gap: '6px'
                                    }}>
                                        {installmentOptions.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setInstallment(opt.value)}
                                                style={{
                                                    padding: '10px 6px',
                                                    borderRadius: '6px',
                                                    border: installment === opt.value
                                                        ? '2px solid var(--primary)'
                                                        : '1px solid rgba(255,255,255,0.2)',
                                                    background: installment === opt.value
                                                        ? 'rgba(59, 130, 246, 0.2)'
                                                        : 'transparent',
                                                    color: 'white',
                                                    fontWeight: '600',
                                                    fontSize: '11px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    textAlign: 'center'
                                                }}
                                            >
                                                {opt.value === 1 ? 'Tek' : opt.value}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
                    <button
                        onClick={() => router.back()}
                        disabled={isProcessing}
                        className="btn btn-outline"
                        style={{
                            padding: '16px 32px',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: '600'
                        }}
                    >
                        ← İptal
                    </button>
                    <button
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className="btn btn-primary"
                        style={{
                            width: '50%',
                            padding: '16px',
                            fontSize: '15px',
                            fontWeight: '700',
                            opacity: isProcessing ? 0.7 : 1,
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            borderRadius: '10px'
                        }}
                    >
                        {isProcessing ? '⏳ İŞLENİYOR...' : '✓ ONAYLA VE FİŞ KES'}
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
