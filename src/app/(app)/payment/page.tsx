"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
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
    
    // Parse customer/supplier ID from either URL parameter or the ref string format
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
                showError('Hata', result?.error || 'Bilinmeyen hata');
            }
        } catch (error) {
            clearTimeout(timeoutId);
            setIsProcessing(false);
            showError('Hata', 'Sistem hatası oluştu. Lütfen tekrar deneyin.');
        }
    };

    const isPayable = paymentType === 'payable';
    const mainColor = isPayable ? 'red' : 'emerald';
    const bgColor = isPayable ? 'bg-red-50 dark:bg-red-500/10' : 'bg-emerald-50 dark:bg-emerald-500/10';
    const textColor = isPayable ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400';
    const actionBg = isPayable ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700';

    return (
        <div className="flex justify-center p-4 sm:p-6 lg:p-10 font-sans min-h-[calc(100vh-80px)] items-start">
            <div className="w-full max-w-2xl bg-white dark:bg-[#0f172a] shadow-xl shadow-blue-900/5 rounded-[24px] border border-slate-200 dark:border-white/5 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Header */}
                <div className={`p-8 text-center border-b border-slate-100 dark:border-white/5 ${bgColor}`}>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-900 rounded-full text-[11px] font-black tracking-widest uppercase mb-4 shadow-sm \${textColor}`}>
                        <span>{isPayable ? '💸' : '💰'}</span>
                        {isPayable ? 'ÖDEME ÇIKIŞI' : 'TAHSİLAT İŞLEMİ'}
                    </div>
                    <div className="text-[14px] text-slate-500 dark:text-slate-400 font-medium mb-1">İşlem Referansı ve Açıklama</div>
                    <div className="text-[16px] font-bold text-slate-800 dark:text-white flex items-center justify-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-200/50 dark:bg-slate-800 rounded font-mono text-[13px] text-slate-600 dark:text-slate-300">#{refId}</span>
                        {title}
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-8 space-y-8">
                    
                    {/* Amount Input */}
                    <div className="flex flex-col items-center justify-center">
                        <label className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-2">İŞLEM TUTARI</label>
                        <div className="relative group w-full max-w-[300px]">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">₺</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full h-16 pl-12 pr-4 bg-slate-50 dark:bg-[#1e293b] border-2 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 outline-none rounded-2xl text-[28px] font-black text-center text-slate-800 dark:text-white transition-all focus:border-blue-500 dark:focus:border-blue-500 font-mono tracking-tight"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Payment Method Selector */}
                    <div>
                        <label className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-3 block text-center">ÖDEME YÖNTEMİ</label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => setPaymentMethod('cash')}
                                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all \${paymentMethod === 'cash' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'border-slate-100 dark:border-white/5 bg-white dark:bg-[#0f172a] text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'}`}
                            >
                                <span className="text-2xl">💵</span>
                                <span className="text-[12px] font-bold">Nakit</span>
                            </button>
                            <button
                                onClick={() => setPaymentMethod('cc')}
                                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all \${paymentMethod === 'cc' ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' : 'border-slate-100 dark:border-white/5 bg-white dark:bg-[#0f172a] text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'}`}
                            >
                                <span className="text-2xl">💳</span>
                                <span className="text-[12px] font-bold">Kredi Kartı</span>
                            </button>
                            <button
                                onClick={() => setPaymentMethod('iban')}
                                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all \${paymentMethod === 'iban' ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'border-slate-100 dark:border-white/5 bg-white dark:bg-[#0f172a] text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'}`}
                            >
                                <span className="text-2xl">🏦</span>
                                <span className="text-[12px] font-bold">Havale / EFT</span>
                            </button>
                        </div>
                    </div>

                    {/* Account Selector */}
                    <div>
                        <label className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-3 block text-center">HEDEF KASA / HESAP</label>
                        <div className="relative max-w-md mx-auto">
                            <select
                                value={selectedAccount}
                                onChange={(e) => setSelectedAccount(e.target.value)}
                                className="w-full h-12 px-4 bg-slate-50 dark:bg-[#1e293b] border-2 border-slate-100 dark:border-white/5 rounded-xl text-[13px] font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 appearance-none cursor-pointer"
                            >
                                {paymentMethod === 'cash' && kasalar.filter(k => k.type === 'Nakit').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                {paymentMethod === 'cc' && kasalar.filter(k => k.type === 'POS' || k.type === 'Kredi Kartı Tahsilat').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                {paymentMethod === 'iban' && kasalar.filter(k => k.type === 'Banka').map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </div>
                        </div>
                    </div>

                    {/* Installments (Only for CC) */}
                    {paymentMethod === 'cc' && (
                        <div className="animate-in fade-in zoom-in-95 duration-200">
                            <label className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-3 block text-center">TAKSİT SEÇENEKLERİ</label>
                            {installmentOptions.length === 0 ? (
                                <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-center text-[12px] font-bold text-red-600">⚠️ Pos Oranları Tanımlanmamış</div>
                            ) : (
                                <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                                    {installmentOptions.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setInstallment(opt.value)}
                                            className={`px-4 py-2 rounded-lg text-[12px] font-bold transition-all border-2 \${installment === opt.value ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-300'}`}
                                        >
                                            {opt.value === 1 ? 'Tek Çekim' : `\${opt.value} Taksit`}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-white/5 flex gap-3 sm:gap-4 flex-col-reverse sm:flex-row">
                    <button 
                        onClick={() => router.back()} 
                        className="flex-1 h-12 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 rounded-xl font-bold text-[13px] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors uppercase tracking-widest"
                        disabled={isProcessing}
                    >
                        GERİ DÖN
                    </button>
                    <button 
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className={`flex-[2] h-12 rounded-xl font-black text-[14px] text-white flex items-center justify-center gap-2 uppercase tracking-wide transition-all \${actionBg} \${isProcessing ? 'opacity-75 cursor-not-allowed scale-[0.98]' : 'shadow-lg hover:shadow-xl hover:-translate-y-0.5'}`}
                    >
                        {isProcessing ? (
                            <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span> İŞLENİYOR...</>
                        ) : (
                            <>ONAYLA VE {isPayable ? 'ÖDE' : 'KAYDET'}</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function PaymentPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div></div>}>
            <PaymentContent />
        </Suspense>
    );
}
