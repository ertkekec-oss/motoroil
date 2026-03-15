"use client";

import React, { useState, useEffect } from 'react';
import { EnterprisePageShell, EnterpriseCard, EnterpriseSectionHeader } from "@/components/ui/enterprise";
import { useApp } from '@/contexts/AppContext';
import { useModal } from "@/contexts/ModalContext";

export default function TenantBillingPage() {
    const { showSuccess, showError, showWarning } = useModal();
    const { currentUser } = useApp();
    const [credits, setCredits] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [cart, setCart] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [checkingOut, setCheckingOut] = useState(false);

    useEffect(() => {
        if (!currentUser) return;
        fetchData();
    }, [currentUser]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [credRes, prodRes] = await Promise.all([
                fetch('/api/billing/credits'),
                fetch('/api/admin/billing-products?activeOnly=true')
            ]);
            if (credRes.ok) setCredits((await credRes.json()).data);
            if (prodRes.ok) setProducts((await prodRes.json()).data);
        } catch (error) {
            console.error('Failed to fetch billing data', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleCart = (productId: string) => {
        setCart(prev => prev.includes(productId)
            ? prev.filter(id => id !== productId)
            : [...prev, productId]);
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setCheckingOut(true);
        try {
            const res = await fetch('/api/billing/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cart })
            });
            const data = await res.json();

            if (data.success && data.checkoutUrl) {
                // Navigate to the simulated gateway URL or integrate gateway script
                window.location.href = data.checkoutUrl;
            } else {
                showError("Uyarı", 'Checkout hatası: ' + data.error);
            }
        } catch (error) {
            console.error(error);
            showError("Uyarı", 'Ödeme başlatılırken bir hata oluştu.');
        } finally {
            setCheckingOut(false);
        }
    };

    const saasProducts = products.filter(p => p.type === 'SAAS');
    const smsProducts = products.filter(p => p.type === 'SMS');
    const invoiceProducts = products.filter(p => p.type === 'EINVOICE');

    const sumCart = cart.reduce((total, id) => {
        const prod = products.find(p => p.id === id);
        return total + (prod ? parseFloat(prod.price) : 0);
    }, 0);

    const smsRem = credits ? credits.smsCredits - credits.smsUsed : 0;
    const invRem = credits ? credits.einvoiceCredits - credits.einvoiceUsed : 0;

    return (
        <EnterprisePageShell
            title="Abonelik, Krediler ve Ödeme (Billing)"
            description="Mevcut kullanım limitlerinizi görün, yeni plan ve paket satın alın."
        >
            {loading ? (
                <div className="p-12 text-center text-slate-500 font-medium">Yükleniyor...</div>
            ) : (
                <div className="space-y-8 animate-fade-in relative pb-32">

                    {/* Alerts based on credit limits */}
                    {(smsRem < 50 || invRem < 20) && (
                        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                            <span className="text-xl">⚠️</span>
                            <div>
                                <h4 className="text-[14px] font-bold text-rose-800 uppercase tracking-wider">Kritik Limit Uyarısı</h4>
                                <p className="text-[13px] text-rose-600 font-medium mt-1">
                                    {smsRem < 50 && `Kalan SMS krediniz çok düşük (${smsRem}). Lütfen paket yükleyin.`}
                                    {invRem < 20 && ` Kalan E-Fatura kontörünüz çok düşük (${invRem}). Lütfen paket yükleyin.`}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* OVERVIEW METRICS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <EnterpriseCard className="p-6 relative overflow-hidden">
                            <div className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center justify-between relative z-10">
                                Kalan SMS Sayısı
                                <span className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center">📩</span>
                            </div>
                            <div className={`text-4xl font-black ${smsRem < 50 ? 'text-rose-600' : 'text-slate-900 dark:text-white'} leading-none relative z-10`}>
                                {smsRem}
                            </div>
                            <div className="text-[12px] font-medium text-slate-400 mt-3 relative z-10">
                                Kullanılan: {credits?.smsUsed || 0} / Toplam Alınan: {credits?.smsCredits || 0}
                            </div>
                        </EnterpriseCard>

                        <EnterpriseCard className="p-6 relative overflow-hidden">
                            <div className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center justify-between relative z-10">
                                E-Fatura Kontörü
                                <span className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center">🧾</span>
                            </div>
                            <div className={`text-4xl font-black ${invRem < 20 ? 'text-rose-600' : 'text-slate-900 dark:text-white'} leading-none relative z-10`}>
                                {invRem}
                            </div>
                            <div className="text-[12px] font-medium text-slate-400 mt-3 relative z-10">
                                Kullanılan: {credits?.einvoiceUsed || 0} / Toplam Alınan: {credits?.einvoiceCredits || 0}
                            </div>
                        </EnterpriseCard>

                        <EnterpriseCard className="p-6 relative overflow-hidden bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-[#0f172a] border-indigo-100 dark:border-indigo-500/10">
                            <div className="text-[12px] font-bold text-indigo-500 uppercase tracking-widest mb-2 flex items-center justify-between relative z-10">
                                Aktif SaaS Planı
                                <span className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 flex items-center justify-center">💼</span>
                            </div>
                            <div className="text-[24px] font-black text-indigo-700 dark:text-indigo-400 leading-none relative z-10 truncate mt-2">
                                {credits?.tenant?.subscription?.plan?.name || 'Ücretsiz Plan'}
                            </div>
                            <div className="text-[12px] font-medium text-indigo-400 mt-3 relative z-10">Periodya altyapısı aktif.</div>
                        </EnterpriseCard>
                    </div>

                    <EnterpriseSectionHeader title="SaaS Lisansları" subtitle="Daha fazla özellik için Periodya paketinizi yükseltin." />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {saasProducts.map(p => (
                            <ProductCard key={p.id} p={p} cart={cart} toggleCart={toggleCart} icon="☁️" />
                        ))}
                    </div>

                    <EnterpriseSectionHeader title="İletişim & Pazarlama (SMS Paketi)" subtitle="Toplu kampanya ve bildirimleriniz için SMS paketi satın alın." />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {smsProducts.map(p => (
                            <ProductCard key={p.id} p={p} cart={cart} toggleCart={toggleCart} icon="📩" />
                        ))}
                    </div>

                    <EnterpriseSectionHeader title="E-Fatura Mühür Kontörleri" subtitle="Muhasebe ve operasyonlarınız için e-fatura/e-arşiv limitlerinizi artırın." />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {invoiceProducts.map(p => (
                            <ProductCard key={p.id} p={p} cart={cart} toggleCart={toggleCart} icon="🧾" />
                        ))}
                    </div>

                    {/* FIXED CART FOOTER */}
                    {cart.length > 0 && (
                        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up pointer-events-none">
                            <div className="max-w-7xl mx-auto flex justify-end">
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl p-4 w-full md:w-[400px] pointer-events-auto flex flex-col gap-4">
                                    <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Sepetiniz (Sepette {cart.length} ürün var)</span>
                                            <span className="text-[24px] font-black text-slate-900 dark:text-white">
                                                {sumCart.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleCheckout}
                                        disabled={checkingOut}
                                        className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold text-[15px] flex items-center justify-center gap-2 transition-transform shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                                    >
                                        {checkingOut ? 'İşlem Başlatılıyor...' : 'Güvenli Ödeme Yap 💳'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </EnterprisePageShell>
    );
}

function ProductCard({ p, cart, toggleCart, icon }: any) {
    const isSelected = cart.includes(p.id);
    return (
        <EnterpriseCard
            className={`p-6 relative transition-all border-2 cursor-pointer group ${isSelected ? 'border-blue-500 bg-blue-50/10' : 'border-transparent hover:border-slate-300 dark:border-white/5 dark:hover:border-white/20'}`}
            onClick={() => toggleCart(p.id)}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-xl">
                    {icon || '💼'}
                </div>
                {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm shadow-md animate-scale-in">✓</div>
                ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center group-hover:border-blue-400 transition-colors"></div>
                )}
            </div>
            <h3 className="text-[18px] font-black text-slate-900 dark:text-white min-h-[50px]">{p.name}</h3>
            {p.creditAmount > 0 && (
                <div className="inline-flex px-2.5 py-1 rounded-[6px] text-[11px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mb-3 mt-1 shadow-sm">
                    +{p.creditAmount} Limit
                </div>
            )}
            <p className="text-[13px] font-medium text-slate-500 h-[40px] leading-relaxed line-clamp-2">
                {p.description || "Bu paket ile sistem kullanım kotalarınızı genişletin."}
            </p>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex items-end justify-between">
                <div className="text-[28px] font-black text-slate-900 dark:text-white leading-none">
                    {parseFloat(p.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[12px] font-bold text-slate-400 mb-1">{p.currency}</div>
            </div>
        </EnterpriseCard>
    );
}
