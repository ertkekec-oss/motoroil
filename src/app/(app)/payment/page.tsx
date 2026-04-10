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
    
    const customerId = searchParams.get('customerId') ||
        (refId.includes('cust-') ? refId.split('cust-')[1] :
            refId.startsWith('CUST-') ? refId.split('-')[1] : undefined);

    const supplierId = searchParams.get('supplierId') ||
        (refId.includes('sup-') ? refId.split('sup-')[1] :
            refId.startsWith('SUP-') ? refId.split('-')[1] : undefined);

    const [amount, setAmount] = useState(initialAmount);
    // Remove auto-formatting logic that causes cursor jumping
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow numbers and decimal point
        const val = e.target.value.replace(/[^0-9.]/g, '');
        // Prevent multiple decimal points
        if (val.split('.').length > 2) return;
        setAmount(val);
    };

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
            else {
                // If there's no matching specific type, try to gracefully fallback to any available that kinda matches
                const anyMatching = kasalar.find(k => 
                    (paymentMethod === 'cash' && k.name.toLowerCase().includes('nakit')) ||
                    (paymentMethod === 'iban' && (k.name.toLowerCase().includes('banka') || k.name.toLowerCase().includes('hesap'))) ||
                    (paymentMethod === 'cc' && (k.name.toLowerCase().includes('pos') || k.name.toLowerCase().includes('kredi')))
                );
                if (anyMatching) setSelectedAccount(anyMatching.id.toString());
                else setSelectedAccount(kasalar[0].id.toString());
            }
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

    return (
        <div className="flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans min-h-[calc(100vh-80px)] bg-[#f8fafc] dark:bg-[#020617]">
            <div className="w-full max-w-[900px] bg-white dark:bg-[#0f172a] shadow-2xl shadow-blue-900/10 dark:shadow-none rounded-[32px] overflow-hidden flex flex-col md:flex-row border border-slate-200 dark:border-white/5 animate-in fade-in zoom-in-95 duration-500">
                
                {/* Left Panel: Context & Amount */}
                <div className={\`w-full md:w-2/5 p-8 sm:p-10 flex flex-col justify-between \${isPayable ? 'bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/20 dark:to-[#0f172a]' : 'bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-[#0f172a]'} border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/5 relative\`}>
                    
                    {/* Decorative Background Blob */}
                    <div className={\`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] -z-0 opacity-40 \${isPayable ? 'bg-rose-400/30' : 'bg-emerald-400/30'}\`}></div>
                    
                    <div className="relative z-10 flex flex-col gap-8">
                        <div>
                            <div className={\`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase mb-6 shadow-sm \${isPayable ? 'bg-white dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50' : 'bg-white dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50'}\`}>
                                <div className={\`w-2 h-2 rounded-full animate-pulse \${isPayable ? 'bg-rose-500' : 'bg-emerald-500'}\`}></div>
                                {isPayable ? 'ÖDEME ÇIKIŞI' : 'TAHSİLAT İŞLEMİ'}
                            </div>
                            
                            <h2 className="text-3xl font-black text-slate-800 dark:text-white leading-tight tracking-tight mb-2">
                                {isPayable ? 'Tutarı Öde' : 'Tahsilatı Al'}
                            </h2>
                            <p className="text-[14px] text-slate-500 dark:text-slate-400 font-medium">Lütfen işleme ait detayları belirleyin ve onaylayın.</p>
                        </div>
                        
                        <div className="bg-white/60 dark:bg-black/20 backdrop-blur-md rounded-2xl p-5 border border-white/50 dark:border-white/5 shadow-sm">
                            <div className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-2">İşlem Referansı</div>
                            <div className="font-bold text-slate-800 dark:text-slate-200 break-words text-[14px]">{title}</div>
                            <div className="mt-2 inline-block px-2.5 py-1 bg-slate-200/50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[11px] font-mono tracking-widest uppercase">#{refId}</div>
                        </div>
                    </div>

                    <div className="relative z-10 mt-10 md:mt-0 pt-10">
                        <label className="text-[11px] font-bold tracking-widest uppercase text-slate-400 mb-2 block">İŞLEM TUTARI</label>
                        <div className="flex items-center gap-2 border-b-2 border-slate-200 dark:border-slate-700 pb-2 transition-colors focus-within:border-blue-500">
                            <span className="text-3xl font-black text-slate-400">₺</span>
                            <input
                                type="text"
                                value={amount}
                                onChange={handleAmountChange}
                                className="w-full bg-transparent border-none outline-none text-4xl sm:text-5xl font-black text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 tracking-tighter"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Panel: Controls & Checkout */}
                <div className="w-full md:w-3/5 p-8 sm:p-10 flex flex-col justify-between relative bg-white dark:bg-[#0f172a]">
                    <div className="flex flex-col gap-8">
                        
                        {/* Custom Tabs for Payment Method */}
                        <div>
                            <label className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-4 block">1. ÖDEME YÖNTEMİ</label>
                            <div className="flex bg-slate-100 dark:bg-[#1e293b] p-1.5 rounded-2xl">
                                <button
                                    onClick={() => setPaymentMethod('cash')}
                                    className={\`flex-1 py-3 text-[13px] font-bold rounded-xl transition-all flex items-center justify-center gap-2 \${paymentMethod === 'cash' ? 'bg-white dark:bg-[#0f172a] text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}\`}
                                >
                                    <span className="text-lg">💵</span> Nakit
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('cc')}
                                    className={\`flex-1 py-3 text-[13px] font-bold rounded-xl transition-all flex items-center justify-center gap-2 \${paymentMethod === 'cc' ? 'bg-white dark:bg-[#0f172a] text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}\`}
                                >
                                    <span className="text-lg">💳</span> Kart
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('iban')}
                                    className={\`flex-1 py-3 text-[13px] font-bold rounded-xl transition-all flex items-center justify-center gap-2 \${paymentMethod === 'iban' ? 'bg-white dark:bg-[#0f172a] text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}\`}
                                >
                                    <span className="text-lg">🏦</span> Havale
                                </button>
                            </div>
                        </div>

                        {/* Kasalar Select */}
                        <div className="animate-in fade-in duration-300 space-y-4">
                            <label className="text-[11px] font-bold tracking-widest text-slate-400 uppercase block">2. HEDEF {paymentMethod === 'cc' ? 'POS' : paymentMethod === 'iban' ? 'BANKA' : 'KASA'}</label>
                            
                            <div className="relative">
                                <select
                                    value={selectedAccount}
                                    onChange={(e) => setSelectedAccount(e.target.value)}
                                    className="w-full h-14 pl-4 pr-12 bg-white dark:bg-[#0f172a] border-2 border-slate-200 dark:border-slate-800 rounded-2xl text-[14px] font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-700"
                                >
                                    {paymentMethod === 'cash' && kasalar.filter(k => k.type === 'Nakit').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    {paymentMethod === 'cc' && kasalar.filter(k => k.type === 'POS' || k.type === 'Kredi Kartı Tahsilat').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    {paymentMethod === 'iban' && kasalar.filter(k => k.type === 'Banka').map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                </div>
                            </div>
                        </div>

                        {/* Installments (Credit Card Only) */}
                        {paymentMethod === 'cc' && (
                            <div className="animate-in slide-in-from-top-4 fade-in duration-300">
                                <label className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-3 block">3. TAKSİT TERCİHİ</label>
                                {installmentOptions.length === 0 ? (
                                    <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl flex items-center gap-3 text-amber-700 dark:text-amber-400">
                                        <span className="text-xl">⚠️</span>
                                        <div className="text-[12px] font-bold">Ayarlardan POS Taksit oranları yapılandırılmamış. Varsayılan Tek Çekim uygulanacak.</div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2">
                                        {installmentOptions.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setInstallment(opt.value)}
                                                className={\`py-3 rounded-xl border-2 transition-all font-bold text-[12px] \${installment === opt.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' : 'border-slate-100 dark:border-white/5 bg-transparent text-slate-500 hover:border-slate-200 dark:hover:border-slate-700'}\`}
                                            >
                                                {opt.value === 1 ? 'Tek Çekim' : \`\${opt.value} Taksit\`}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mt-12 flex gap-3 h-14">
                        <button 
                            onClick={() => router.back()} 
                            disabled={isProcessing}
                            className="px-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[13px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center"
                        >
                            İPTAL
                        </button>
                        <button 
                            onClick={handlePayment}
                            disabled={isProcessing}
                            className={\`flex-1 rounded-2xl font-black text-[14px] text-white flex items-center justify-center gap-3 uppercase tracking-wide transition-all \${isPayable ? 'bg-[#e11d48] hover:bg-[#be123c] shadow-rose-500/30' : 'bg-[#059669] hover:bg-[#047857] shadow-emerald-500/30'} \${isProcessing ? 'opacity-70 scale-95' : 'shadow-xl hover:shadow-2xl hover:-translate-y-1'}\`}
                        >
                            {isProcessing ? (
                                <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> İŞLENİYOR...</>
                            ) : (
                                <>ONAYLA VE {isPayable ? 'ÖDEMEYİ YAP' : 'TAHSİLAT GİR'}</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PaymentPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div></div>}>
            <PaymentContent />
        </Suspense>
    );
}
