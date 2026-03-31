"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';
import { useFinancials } from '@/contexts/FinancialContext';
import EnterpriseCard from '@/components/ui/EnterpriseCard';
import EnterpriseButton from '@/components/ui/EnterpriseButton';
import EnterpriseInput from '@/components/ui/EnterpriseInput';
import EnterpriseSelect from '@/components/ui/EnterpriseSelect';

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
            let description = String(title);
            if (paymentMethod === 'cash') description += ' (Nakit)';
            else if (paymentMethod === 'cc') {
                const instLabel = installmentOptions.find(opt => opt.value === installment)?.label || 'Tek Çekim';
                description += ' (Kredi Kartı - ' + instLabel + ')';
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
        { id: 'cash', icon: '💵', label: 'Nakit Kasa', colorClass: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/30' },
        { id: 'cc', icon: '💳', label: 'POS / Kredi Kartı', colorClass: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-500/30' },
        { id: 'iban', icon: '🏦', label: 'Banka / Havale', colorClass: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-500/30' }
    ];

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-slate-50 dark:bg-[#080a0f] font-sans">
            <EnterpriseCard className="w-full max-w-[1200px] bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-3xl shadow-2xl border-slate-200 dark:border-white/5 p-8 sm:p-12 animate-in zoom-in-95 duration-300 rounded-[32px]">
                
                {/* Header */}
                <div className="text-center mb-10 pb-8 border-b border-slate-200 dark:border-slate-800">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-black text-[13px] tracking-[0.2em] uppercase mb-4 ${
                        paymentType === 'payable' 
                            ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40' 
                            : 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40'
                    }`}>
                        <span className="text-lg">{paymentType === 'payable' ? '💸' : '💰'}</span>
                        {paymentType === 'payable' ? 'ÖDEME İŞLEMİ' : 'TAHSİLAT İŞLEMİ'}
                    </div>
                    <div className="mt-2 text-slate-600 dark:text-slate-400 font-semibold text-[15px] max-w-xl mx-auto flex items-center justify-center gap-3">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-blue-600 dark:text-blue-400 font-bold border border-slate-200 dark:border-white/5 shadow-sm">#{refId}</span>
                        <span>{title}</span>
                    </div>
                </div>

                {/* Main Content - Flex/Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                    
                    {/* Left: Amount */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[24px] border border-slate-200 dark:border-white/5 flex flex-col justify-center items-center lg:items-start transition-all hover:bg-slate-100 dark:hover:bg-slate-800/80">
                        <label className="text-[11px] uppercase tracking-widest font-black text-slate-400 mb-6">
                            İŞLEM TUTARI
                        </label>
                        <div className="flex items-center gap-4 w-full justify-center lg:justify-start">
                            <span className="text-[48px] font-black text-blue-500 leading-none">₺</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="bg-transparent border-none text-slate-900 dark:text-white text-[56px] font-black w-full min-w-[200px] outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700 font-mono tracking-tighter"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Middle: Payment Method */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[24px] border border-slate-200 dark:border-white/5 transition-all hover:bg-slate-100 dark:hover:bg-slate-800/80">
                        <label className="text-[11px] uppercase tracking-widest font-black text-slate-400 mb-6 block">
                            ÖDEME YÖNTEMİ
                        </label>
                        <div className="flex flex-col gap-3">
                            {paymentMethods.map(method => {
                                const isSelected = paymentMethod === method.id;
                                return (
                                    <button
                                        key={method.id}
                                        onClick={() => setPaymentMethod(method.id)}
                                        className={`flex items-center gap-4 p-4 rounded-[16px] border-2 transition-all duration-200 w-full text-left ${
                                            isSelected 
                                                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 shadow-sm' 
                                                : 'border-transparent bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm'
                                        }`}
                                    >
                                        <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center text-[24px] shadow-sm ${method.colorClass}`}>
                                            {method.icon}
                                        </div>
                                        <span className={`font-bold text-[16px] flex-1 ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                            {method.label}
                                        </span>
                                        {isSelected && (
                                            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-[12px] font-black shadow-sm">
                                                ✓
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Account & Installments */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[24px] border border-slate-200 dark:border-white/5 transition-all hover:bg-slate-100 dark:hover:bg-slate-800/80 flex flex-col gap-6">
                        <div>
                            <label className="text-[11px] uppercase tracking-widest font-black text-slate-400 mb-4 block">
                                HEDEF KASA/BANKA
                            </label>
                            <EnterpriseSelect
                                value={selectedAccount}
                                onChange={(e) => setSelectedAccount(e.target.value)}
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
                            </EnterpriseSelect>
                        </div>

                        {/* Installments Wrapper */}
                        {paymentMethod === 'cc' && (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-300 mt-2">
                                <label className="text-[11px] uppercase tracking-widest font-black text-slate-400 mb-4 block">
                                    TAKSİT / KOMİSYON ORANI
                                </label>
                                {installmentOptions.length === 0 ? (
                                    <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-[16px] text-center text-red-600 dark:text-red-400 font-bold text-[13px]">
                                        ⚠️ Pos Taksit Oranları Girilmemiş
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2">
                                        {installmentOptions.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setInstallment(opt.value)}
                                                className={`py-3 px-2 rounded-[12px] font-bold text-[12px] transition-all border-2 ${
                                                    installment === opt.value
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 shadow-sm'
                                                        : 'border-transparent bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm'
                                                }`}
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

                {/* Bottom Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-8 border-t border-slate-200 dark:border-slate-800">
                    <EnterpriseButton
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isProcessing}
                        className="w-full sm:w-auto h-16 px-8 rounded-[20px] text-[15px] font-bold"
                    >
                        ← GERİ DÖN
                    </EnterpriseButton>

                    <button
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className={`w-full sm:w-[60%] h-16 rounded-[20px] text-[16px] font-black text-white flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${
                            paymentType === 'payable'
                                ? 'bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 shadow-red-500/25 border border-red-400/20'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 shadow-blue-500/25 border border-blue-400/20'
                        } ${isProcessing ? 'opacity-80 scale-[0.98]' : 'hover:-translate-y-1'}`}
                    >
                        {isProcessing ? (
                            <>
                                <span className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></span>
                                İŞLEM ONAYLANIYOR...
                            </>
                        ) : paymentType === 'payable' ? (
                            <>💸 ONAYLA VE ÖDEMEYİ GERÇEKLEŞTİR</>
                        ) : (
                            <>💰 ONAYLA VE TAHSİLATI KAYDET</>
                        )}
                    </button>
                </div>
            </EnterpriseCard>
        </div>
    );
}

export default function PaymentPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#080a0f]">
                <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        }>
            <PaymentContent />
        </Suspense>
    );
}
