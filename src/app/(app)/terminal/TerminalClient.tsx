"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useInventory } from '@/contexts/InventoryContext';
import { useFinancials } from '@/contexts/FinancialContext';
import { useSales } from '@/contexts/SalesContext';
import { useCRM } from '@/contexts/CRMContext';
import { useApp } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';

import { useOfflineDetector, addToQueue, syncQueue, getQueue } from '@/lib/pos-offline';

import PosSearchBar from '@/components/terminal/PosSearchBar';
import CartTable from '@/components/terminal/CartTable';
import CheckoutPanel from '@/components/terminal/CheckoutPanel';
import AiCashierPanel from '@/components/terminal/AiCashierPanel';
import CameraScanModal from '@/components/terminal/CameraScanModal';
import OfflineBadge from '@/components/terminal/OfflineBadge';
import { Clock, Tag, FileText, Gift, CreditCard } from 'lucide-react';

export default function TerminalClient() {
    const { products } = useInventory();
    const { kasalar } = useFinancials();
    const { customers } = useCRM();
    const { processSale, suspendedSales, suspendSale, removeSuspendedSale } = useSales();
    const { currentUser } = useApp();
    const { showSuccess, showError, showWarning } = useModal();

    const searchInputRef = useRef<HTMLInputElement>(null);
    const checkoutPanelRef = useRef<HTMLDivElement>(null);

    const [cart, setCart] = useState<any[]>([]);
    const [searchInput, setSearchInput] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState('Perakende Müşteri');
    const [paymentMode, setPaymentMode] = useState<'cash' | 'card' | 'transfer' | 'account' | null>(null);
    const [selectedKasa, setSelectedKasa] = useState<string | number>('');

    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCameraModal, setShowCameraModal] = useState(false);
    const [showResumptionModal, setShowResumptionModal] = useState(false);
    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const [suspenseLabel, setSuspenseLabel] = useState('');

    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [showExtrasModal, setShowExtrasModal] = useState(false);

    // Order Extras
    const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
    const [discountCode, setDiscountCode] = useState('');
    const [pointsToUse, setPointsToUse] = useState<number>(0);
    const [referenceNote, setReferenceNote] = useState('');

    const [activePriceListId, setActivePriceListId] = useState<string | null>(null);
    const [activePriceListName, setActivePriceListName] = useState<string | null>(null);
    const [priceMap, setPriceMap] = useState<Record<string, number>>({});
    const [isProcessing, setIsProcessing] = useState(false);
    const { isOnline } = useOfflineDetector();

    // Price Resolution
    const getPrice = useCallback((product: any) => {
        if (priceMap[product.id] !== undefined) return priceMap[product.id];
        return Number(product.price || 0);
    }, [priceMap]);

    useEffect(() => {
        const resolvePriceList = async () => {
            if (!selectedCustomer) return;
            const cust = customers.find(c => c.name === selectedCustomer);
            const customerId = cust?.id;
            if (!customerId) {
                setActivePriceListId(null);
                setActivePriceListName(null);
                setPriceMap({});
                return;
            }
            try {
                const res = await fetch('/api/pricing/resolve-customer', {
                    method: 'POST',
                    body: JSON.stringify({ customerId })
                });
                const data = await res.json();
                if (data.success && data.data?.priceList) {
                    const { id: listId, name: listName } = data.data.priceList;
                    if (listId !== activePriceListId) {
                        setActivePriceListId(listId);
                        setActivePriceListName(listName);
                        const pRes = await fetch(`/api/pricing/lists/${listId}/prices`);
                        const pData = await pRes.json();
                        if (pData.success) {
                            const newPriceMap = pData.data.priceMap || {};
                            setPriceMap(newPriceMap);
                            setCart(prevCart => prevCart.map(item => {
                                if (newPriceMap[item.id] !== undefined) {
                                    return { ...item, price: newPriceMap[item.id] };
                                }
                                return item;
                            }));
                        }
                    }
                }
            } catch (e) { console.error("Price resolution failed", e); }
        };
        if (isOnline) resolvePriceList();
    }, [selectedCustomer, customers, activePriceListId, isOnline]);

    // Offline Sync
    useEffect(() => {
        if (isOnline) {
            syncQueue(async (payload) => !!await processSale(payload));
        }
    }, [isOnline, processSale]);

    // Filter Data
    const filteredProducts = useMemo(() => {
        if (!searchInput || searchInput.length < 2) return [];
        return (products || []).filter(p =>
            (p.name?.toLowerCase().includes(searchInput.toLowerCase())) ||
            (p.barcode?.includes(searchInput))
        ).slice(0, 10);
    }, [products, searchInput]);

    const filteredCustomers = useMemo(() => {
        if (!customerSearch) return (customers || []).slice(0, 20);
        return (customers || []).filter(c => c.name?.toLowerCase().includes(customerSearch.toLowerCase()));
    }, [customers, customerSearch]);

    const addToCart = useCallback((product: any) => {
        setCart((prev: any[]) => {
            const exist = prev.find(i => i.id === product.id);
            if (exist) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
            const resolvedPrice = getPrice(product);
            return [...prev, { ...product, price: resolvedPrice, qty: 1 }];
        });
        setSearchInput('');
        searchInputRef.current?.focus();
    }, [getPrice]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchInput) return;
        const prod = products.find(p => p.barcode === searchInput || p.code === searchInput);
        if (prod) addToCart(prod);
        else if (filteredProducts.length === 1) addToCart(filteredProducts[0]);
        else showWarning("Bulunamadı", "Sistemde böyle bir barkod veya ürün bulunamadı.");
    };

    const handleVoiceCommand = (cmd: string) => {
        // Basic heuristic parsing
        if (cmd.includes('nakit')) setPaymentMode('cash');
        else if (cmd.includes('kart')) setPaymentMode('card');
        else if (cmd.includes('ödeme')) checkoutPanelRef.current?.focus();
        else if (cmd.includes('iptal')) setCart([]);
    };

    // Calculations
    const subtotal = cart.reduce((sum, item) => sum + (Number(item.price || 0) * item.qty), 0);
    const totalDiscount = appliedDiscount || 0;
    const vatExcludedTotal = subtotal / 1.2;
    const finalTotal = Math.max(0, subtotal - totalDiscount - (pointsToUse || 0));
    const customer = customers.find(c => c.name === selectedCustomer);

    // Finalize (Offline aware)
    const handleFinalize = async () => {
        if (cart.length === 0 || isProcessing) return;
        if (!paymentMode) return showWarning("Hata", "Lütfen bir ödeme yöntemi seçiniz.");

        // Auto-select first matching kasa if none selected to save clicks
        if (!selectedKasa && kasalar?.length > 0 && paymentMode !== 'account') {
            const defaultCash = kasalar.find((k: any) => k.type === 'Nakit');
            const defaultCard = kasalar.find((k: any) => k.type === 'Kredi Kartı' || k.type?.includes('POS'));
            const auto = paymentMode === 'cash' ? defaultCash : defaultCard;
            if (auto) setSelectedKasa(auto.id);
        }

        setShowCheckoutModal(true);
    };

    const executeSale = async () => {
        if (paymentMode !== 'account' && !selectedKasa && kasalar?.length > 0) {
            return showWarning("Hata", "Lütfen kasa/banka seçiniz.");
        }

        const payload = {
            items: cart.map(i => ({ productId: i.id, qty: i.qty })),
            total: finalTotal,
            customerName: selectedCustomer,
            description: referenceNote ? `REF: ${referenceNote}` : `POS: ${selectedCustomer}`,
            paymentMode,
            kasaId: selectedKasa || 'CashKasa',
            customerId: customer?.id,
            discountAmount: totalDiscount,
            couponCode: discountCode,
            pointsUsed: pointsToUse || 0,
            installments: undefined
        };

        setIsProcessing(true);
        try {
            if (!isOnline) {
                addToQueue('sale', payload);
                showSuccess("Offline: İşlem kuyruğa alındı. Online olunca otomatik gönderilecek.", "");
                resetTerminalState();
                return;
            }

            const success = await processSale(payload);
            if (success) {
                showSuccess("Satış Başarıyla Tamamlandı", "");
                resetTerminalState();
            } else {
                showError("İşlem Reddedildi", "Satış kaydedilemedi.");
            }
        } catch (e: any) { showError("Hata", e.message); }
        finally { setIsProcessing(false); searchInputRef.current?.focus(); }
    };

    const resetTerminalState = () => {
        setCart([]);
        setPaymentMode(null);
        setSelectedCustomer('Perakende Müşteri');
        setAppliedDiscount(0);
        setDiscountCode('');
        setPointsToUse(0);
        setReferenceNote('');
        setShowCheckoutModal(false);
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only ignore inputs if the key isn't an F-key or Esc
            const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

            switch (e.key) {
                case 'F3':
                    e.preventDefault();
                    searchInputRef.current?.focus();
                    break;
                case 'F8':
                    e.preventDefault();
                    setIsCustomerModalOpen(true);
                    break;
                case 'F9':
                    e.preventDefault();
                    setShowResumptionModal(true);
                    break;
                case 'F10':
                    e.preventDefault();
                    checkoutPanelRef.current?.focus();
                    break;
                case 'F11':
                    e.preventDefault();
                    setPaymentMode('cash');
                    break;
                case 'F12':
                    e.preventDefault();
                    setPaymentMode('card');
                    break;
                case 'Escape':
                    e.preventDefault();
                    setIsCustomerModalOpen(false);
                    setShowCameraModal(false);
                    setShowResumptionModal(false);
                    setShowSuspendModal(false);
                    setShowCheckoutModal(false);
                    setShowExtrasModal(false);
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="pos-terminal-scope flex flex-col flex-1 h-[calc(100vh-64px)] md:h-screen w-full bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white transition-colors duration-300 overflow-hidden">
            {/* SCOPE CSS (isolated) */}
            <style dangerouslySetInnerHTML={{
                __html: `
        .pos-terminal-scope { overflow-x: hidden; }
        .pos-terminal-scope * { outline-color: #6366f1 !important; }
      `}} />

            {/* TOP KPI STRIP (110px max) */}
            <div className="h-[110px] shrink-0 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#0B1220] flex items-center px-6 gap-6 shadow-sm z-10">
                <div className="flex flex-col">
                    <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <span className="text-indigo-600 dark:text-indigo-400 shrink-0">Terminal Workspace</span>
                    </h1>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        Cari: <span className="text-slate-700 dark:text-slate-300">{selectedCustomer}</span>
                    </p>
                </div>
                <div className="h-10 w-px bg-slate-200 dark:bg-white/10 mx-2 hidden md:block"></div>

                <div className="flex gap-4">
                    <div className="px-4 border-l border-slate-100 dark:border-white/5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Açık Hesap</span>
                        <span className="text-sm font-bold">{customer?.balance || 0} TL</span>
                    </div>
                </div>

                <div className="ml-auto flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 border-r border-slate-200 dark:border-white/10 pr-4 mr-2">
                        <button onClick={() => setShowExtrasModal(true)} className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/5 text-[11px] font-bold transition-colors">
                            <Tag size={12} /> Kupon {discountCode && <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>}
                        </button>
                        <button onClick={() => setShowExtrasModal(true)} className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/5 text-[11px] font-bold transition-colors">
                            <Gift size={12} /> Puan {pointsToUse > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                        </button>
                        <button onClick={() => setShowExtrasModal(true)} className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/5 text-[11px] font-bold transition-colors">
                            <FileText size={12} /> Ref {referenceNote && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>}
                        </button>
                    </div>

                    <button onClick={() => setShowResumptionModal(true)} className="flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 hover:bg-amber-100 px-3 py-1.5 rounded-full text-xs font-bold border border-amber-200 dark:border-amber-500/20 transition-colors">
                        <Clock size={14} /> Bekleyenler ({suspendedSales?.length || 0}) <kbd className="hidden sm:inline-block font-sans opacity-70 border border-current px-1 rounded ml-1">F9</kbd>
                    </button>
                    <OfflineBadge />
                </div>
            </div>

            {/* MAIN GRID */}
            <div className="flex-1 flex flex-row gap-4 lg:gap-6 p-4 lg:p-6 min-h-0 overflow-hidden">

                {/* TERMINAL WORKSPACE (Left) */}
                <div className="flex-1 min-w-0 flex flex-col gap-4">
                    <div className="w-full">
                        <PosSearchBar
                            ref={searchInputRef}
                            searchInput={searchInput}
                            setSearchInput={setSearchInput}
                            handleSearchSubmit={handleSearchSubmit}
                            filteredProducts={filteredProducts}
                            addToCart={addToCart}
                            getPrice={getPrice}
                            onVoiceCommand={handleVoiceCommand}
                            onCameraClick={() => setShowCameraModal(true)}
                        />
                    </div>

                    <AiCashierPanel cartItems={cart} onAddSuggested={addToCart} />

                    <div className="flex-1 min-h-0 overflow-y-auto mt-2">
                        <CartTable cart={cart} setCart={setCart} getPrice={getPrice} />
                    </div>
                </div>

                {/* CHECKOUT PANEL (Right) */}
                <div className="w-[300px] lg:w-[380px] shrink-0 h-full flex flex-col">
                    <CheckoutPanel
                        ref={checkoutPanelRef}
                        cart={cart}
                        subtotal={subtotal}
                        finalTotal={finalTotal}
                        vatExcludedTotal={vatExcludedTotal}
                        totalDiscount={totalDiscount + (pointsToUse || 0)}
                        selectedCustomer={selectedCustomer}
                        customers={customers}
                        activePriceListName={activePriceListName}
                        setIsCustomerModalOpen={setIsCustomerModalOpen}
                        paymentMode={paymentMode}
                        setPaymentMode={setPaymentMode}
                        handleFinalize={handleFinalize}
                        handleSuspend={() => setShowSuspendModal(true)}
                        isProcessing={isProcessing}
                        isOnline={isOnline}
                    />
                </div>
            </div>

            {/* MODALS */}
            {isCustomerModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-lg font-bold mb-4">Müşteri Seçimi (F8)</h3>
                        <input autoFocus placeholder="Arama..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-3 mb-4 focus:ring-2 focus:ring-indigo-500" />
                        <div className="max-h-[300px] overflow-y-auto space-y-2">
                            <button onClick={() => { setSelectedCustomer('Perakende Müşteri'); setIsCustomerModalOpen(false); }} className="w-full text-left p-3 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">Perakende Müşteri</span>
                            </button>
                            {filteredCustomers.map(c => (
                                <button key={c.id} onClick={() => { setSelectedCustomer(c.name); setIsCustomerModalOpen(false); }} className="w-full text-left p-3 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex justify-between">
                                    <span className="font-bold truncate">{c.name}</span>
                                    <span className="text-xs text-slate-500">{c.balance || 0} TL</span>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setIsCustomerModalOpen(false)} className="mt-4 w-full h-12 rounded-xl font-bold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10">ESC - Kapat</button>
                    </div>
                </div>
            )}

            {showCameraModal && (
                <CameraScanModal
                    onClose={() => setShowCameraModal(false)}
                    onScan={(barcode) => {
                        setSearchInput(barcode);
                        setShowCameraModal(false);
                        setTimeout(() => {
                            const form = document.querySelector('form');
                            if (form) form.requestSubmit();
                        }, 100);
                    }}
                />
            )}

            {showResumptionModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-lg font-bold mb-4">Bekleyen Satışlar (F9)</h3>
                        {(!suspendedSales || suspendedSales.length === 0) ? (
                            <div className="text-center opacity-50 py-8">Bekleyen satış yok.</div>
                        ) : (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {suspendedSales.map((sale: any) => (
                                    <div key={sale.id} className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 flex justify-between items-center">
                                        <div>
                                            <div className="font-bold text-amber-500">{sale.label}</div>
                                            <div className="text-xs opacity-50">{new Date(sale.timestamp).toLocaleTimeString()} - {sale.items?.length || 0} Ürün</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="font-bold text-sm mr-2">₺{sale.total?.toLocaleString() || 0}</div>
                                            <button onClick={() => {
                                                setCart(sale.items.map((i: any) => ({ ...i.product, qty: i.qty })));
                                                setSelectedCustomer(sale.customer?.name || 'Perakende Müşteri');
                                                removeSuspendedSale(sale.id);
                                                setShowResumptionModal(false);
                                            }} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700">AÇ</button>
                                            <button onClick={() => removeSuspendedSale(sale.id)} className="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20">SİL</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button onClick={() => setShowResumptionModal(false)} className="mt-4 w-full h-12 rounded-xl font-bold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10">ESC - Kapat</button>
                    </div>
                </div>
            )}

            {showSuspendModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-md bg-white dark:bg-[#0f172a] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-2xl">
                        <h3 className="text-xl font-bold mb-4">Satışı Beklemeye Al</h3>
                        <input autoFocus placeholder="Etiket / İsim (Örn: Masa 5 veya Müşteri Adı)" value={suspenseLabel} onChange={e => setSuspenseLabel(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-3 mb-4 focus:ring-2 focus:ring-indigo-500" />
                        <div className="flex gap-2">
                            <button onClick={() => setShowSuspendModal(false)} className="flex-1 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-white/20">İptal</button>
                            <button
                                onClick={() => {
                                    if (!suspenseLabel) return showWarning("Hata", "Lütfen bir etiket giriniz.");
                                    suspendSale(suspenseLabel, cart.map(i => ({ product: i, qty: i.qty })), customer, finalTotal);
                                    resetTerminalState(); setSuspenseLabel(''); setShowSuspendModal(false);
                                    showSuccess("Satış beklemeye alındı", "");
                                }}
                                className="flex-1 bg-amber-500 text-amber-950 py-3 rounded-xl font-bold hover:bg-amber-600">
                                Beklemeye Al
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EXTRAS MODAL (Discount, Coupon, Ref) */}
            {showExtrasModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-md bg-white dark:bg-[#0f172a] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-lg font-black tracking-tight mb-5">Sipariş Ekstraları</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold opacity-50 block mb-1.5 uppercase tracking-widest">Sepet İndirimi (₺)</label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 -mt-2.5 text-slate-400" size={20} />
                                    <input type="number" min="0" value={appliedDiscount || ''} onChange={e => setAppliedDiscount(Number(e.target.value))} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500" placeholder="0.00" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold opacity-50 block mb-1.5 uppercase tracking-widest">Kupon Kodu</label>
                                <input type="text" value={discountCode} onChange={e => setDiscountCode(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 uppercase" placeholder="KOD GİRİN" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold opacity-50 block mb-1.5 uppercase tracking-widest">Puan Kullan ({customer?.points || 0} Kullanılabilir)</label>
                                <div className="relative">
                                    <Gift className="absolute left-3 top-1/2 -mt-2.5 text-slate-400" size={20} />
                                    <input type="number" max={customer?.points || 0} min="0" value={pointsToUse || ''} onChange={e => setPointsToUse(Number(e.target.value))} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500" placeholder="0" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold opacity-50 block mb-1.5 uppercase tracking-widest">Sipariş Notu / Referans</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 -mt-2.5 text-slate-400" size={20} />
                                    <input type="text" value={referenceNote} onChange={e => setReferenceNote(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500" placeholder="Örn: Evrak No, Sipariş No, Masa No vb." />
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setShowExtrasModal(false)} className="mt-6 w-full h-12 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">EKLE VE KAPAT</button>
                    </div>
                </div>
            )}

            {showCheckoutModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
                        <h3 className="text-xl font-black mb-4 flex items-center gap-2 tracking-tight"><CreditCard className="text-indigo-500" /> Ödemeyi Tamamla</h3>

                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-5 rounded-2xl mb-6 shadow-sm">
                            <div className="flex justify-between text-sm font-bold text-slate-500 mb-2"><span>Sepet Ara Toplam</span><span>₺{subtotal.toLocaleString()}</span></div>
                            {(appliedDiscount > 0 || pointsToUse > 0) && (
                                <div className="flex justify-between text-sm font-bold text-emerald-500 mb-2"><span>İndirim / Puan</span><span>-₺{(appliedDiscount + (pointsToUse || 0)).toLocaleString()}</span></div>
                            )}
                            <div className="h-px w-full bg-slate-200 dark:bg-white/10 my-3"></div>
                            <div className="flex justify-between text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight"><span>Genel Toplam</span><span>₺{finalTotal.toLocaleString()}</span></div>
                        </div>

                        {paymentMode !== 'account' && (
                            <div className="mb-6">
                                <label className="text-[10px] font-bold opacity-50 uppercase tracking-widest block mb-3">Hedef Kasa / Banka Seçimi</label>
                                <div className="grid grid-cols-2 gap-3 max-h-[160px] overflow-y-auto pr-1">
                                    {(kasalar || []).filter((k: any) => paymentMode === 'cash' ? k.type === 'Nakit' : k.type !== 'Nakit').map((k: any) => (
                                        <button
                                            key={k.id}
                                            onClick={() => setSelectedKasa(k.id)}
                                            className={`p-4 rounded-xl border flex flex-col justify-center transition-all shadow-sm ${selectedKasa === k.id ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 ring-2 ring-indigo-500/50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'}`}
                                        >
                                            <span className={`text-sm font-bold truncate block w-full text-left ${selectedKasa === k.id ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>{k.name}</span>
                                            <span className={`text-[10px] mt-1 text-left uppercase font-bold tracking-widest ${selectedKasa === k.id ? 'text-indigo-500 dark:text-indigo-500/70' : 'text-slate-400 dark:text-slate-500'}`}>{k.currency || 'TRY'} • Bakiye: {k.balance || 0}</span>
                                        </button>
                                    ))}
                                    {(!(kasalar || []).filter((k: any) => paymentMode === 'cash' ? k.type === 'Nakit' : k.type !== 'Nakit').length) && (
                                        <div className="col-span-2 text-sm text-center py-4 bg-slate-50 dark:bg-[#020617] rounded-xl text-slate-500 border border-slate-200 dark:border-white/5 font-medium">Bu ödeme tipi için tanımlı kasa bulunamadı.</div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setShowCheckoutModal(false)} className="flex-1 py-4 font-bold rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">İptal / Vazgeç</button>
                            <button onClick={executeSale} disabled={isProcessing} className="flex-1 py-4 font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-md shadow-indigo-600/20 text-[15px]">
                                {isProcessing ? 'İŞLENİYOR...' : 'ONAYLA VE BİTİR'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
