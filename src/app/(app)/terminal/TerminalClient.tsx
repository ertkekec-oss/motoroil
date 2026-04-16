"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useInventory } from '@/contexts/InventoryContext';
import { useFinancials } from '@/contexts/FinancialContext';
import { useSales } from '@/contexts/SalesContext';
import { useCRM } from '@/contexts/CRMContext';
import { useApp } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useLanguage } from '@/contexts/LanguageContext';

import { useOfflineDetector, addToQueue, syncQueue, getQueue } from '@/lib/pos-offline';

import PosSearchBar from '@/components/terminal/PosSearchBar';
import CartTable from '@/components/terminal/CartTable';
import CheckoutPanel from '@/components/terminal/CheckoutPanel';
import AiCashierPanel from '@/components/terminal/AiCashierPanel';
import CameraScanModal from '@/components/terminal/CameraScanModal';
import OfflineBadge from '@/components/terminal/OfflineBadge';
import B2BInvoiceWorkspace from '@/components/terminal/B2BInvoiceWorkspace';
import EMustahsilWorkspace from '@/components/terminal/EMustahsilWorkspace';
import ESMMWorkspace from '@/components/terminal/ESMMWorkspace';
import EAdisyonWorkspace from '@/components/terminal/EAdisyonWorkspace';
import { Clock, Tag, FileText, Gift, CreditCard, Utensils } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TerminalClient() {
    const router = useRouter();
    const { products } = useInventory();
    const { kasalar, salesExpenses } = useFinancials();
    const { customers } = useCRM();
    const { processSale, suspendedSales, suspendSale, removeSuspendedSale } = useSales();
    const { currentUser } = useApp();
    const { showSuccess, showError, showWarning } = useModal();
    const { appSettings, updateAppSetting, campaigns } = useSettings();
    const { t } = useLanguage();

    const searchInputRef = useRef<HTMLInputElement>(null);
    const checkoutPanelRef = useRef<HTMLDivElement>(null);

    const [cart, setCart] = useState<any[]>([]);
    const [searchInput, setSearchInput] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState('Perakende Müşteri');
    const [paymentMode, setPaymentMode] = useState<'cash' | 'card' | 'transfer' | 'account' | null>(null);
    const [selectedKasa, setSelectedKasa] = useState<string | number>('');
    const [selectedTaksit, setSelectedTaksit] = useState<any>(null);
    const [terminalMode, setTerminalMode] = useState<'pos' | 'b2b' | 'emustahsil' | 'esmm' | 'eadisyon'>('pos');

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

    // Forex Currency Rates
    const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
    const useForex = appSettings?.useForexRate === true;

    useEffect(() => {
        if (useForex && isOnline) {
            // Fetch live rates via robust internal proxy (evades adblockers and CORS)
            fetch('/api/forex')
                .then(res => res.json())
                .then(data => {
                    if (data && data.success && data.rates) {
                        const ratesToTry: Record<string, number> = {};
                        Object.keys(data.rates).forEach(currency => {
                            ratesToTry[currency.toUpperCase()] = 1 / data.rates[currency];
                        });
                        ratesToTry['TRY'] = 1;
                        ratesToTry['TL'] = 1;
                        setExchangeRates(ratesToTry);
                    }
                })
                .catch(err => console.error("Forex proxy fetch failed", err));
        }
    }, [useForex, isOnline]);

    // Price Resolution
    const getPrice = useCallback((product: any) => {
        let basePrice = Number(product.price || 0);
        if (priceMap[product.id] !== undefined) basePrice = priceMap[product.id];

        const currency = (product.currency || 'TRY').toUpperCase();

        // Apply Forex Exchange Rate Conversion if enabled and product is not TRY
        if (useForex && currency !== 'TRY' && currency !== 'TL' && exchangeRates[currency]) {
            basePrice = basePrice * exchangeRates[currency];
        }

        return basePrice;
    }, [priceMap, useForex, exchangeRates]);

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
                
                const resolvedList = data.priceList || data.data?.priceList;

                if (data.success && resolvedList) {
                    const { id: listId, name: listName } = resolvedList;
                    if (listId !== activePriceListId) {
                        setActivePriceListId(listId);
                        setActivePriceListName(listName);
                        const pRes = await fetch(`/api/pricing/lists/${listId}/prices`);
                        const pData = await pRes.json();
                        if (pData.success || pData.ok) {
                            const newPriceMap = pData.priceMap || pData.data?.priceMap || {};
                            setPriceMap(newPriceMap);
                        }
                    }
                } else {
                    // Müşterinin veya sınıfının özel bir listesi yok, varsayılan fiyata (Product.price) dön.
                    setActivePriceListId(null);
                    setActivePriceListName(null);
                    setPriceMap({});
                }
            } catch (e) { console.error("Price resolution failed", e); }
        };
        if (isOnline) resolvePriceList();
    }, [selectedCustomer, customers, activePriceListId, isOnline]);

    // Offline Sync
    useEffect(() => {
        if (isOnline) {
            syncQueue(async (payload) => {
                const res = await processSale(payload);
                return res.success;
            });
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
            return [...prev, { ...product, qty: 1 }];
        });
        setSearchInput('');
        searchInputRef.current?.focus();
    }, []);

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

    // Base Calculations
    const subtotal = cart.reduce((sum, item) => sum + (Number(getPrice(item) || 0) * item.qty), 0);
    const customer = customers.find(c => c.name === selectedCustomer);

    // Campaigns
    const applicableCampaigns = useMemo(() => {
        if (!campaigns || !Array.isArray(campaigns)) return [];
        const active = campaigns.filter((c: any) => c.isActive && !c.deletedAt);
        const customerRec = customers.find(c => c.name === selectedCustomer);
        const custClass = customerRec?.customerClass || null;

        return active.filter((camp: any) => {
            const isPosOrGlobal = !camp.channels || camp.channels.length === 0 || camp.channels.includes('POS') || camp.channels.includes('GLOBAL');
            if (!isPosOrGlobal) return false;

            const isIsolated = camp.targetCustomerCategoryIds && camp.targetCustomerCategoryIds.length > 0;
            if (isIsolated && (!custClass || !camp.targetCustomerCategoryIds.includes(custClass))) return false;

            let conds: any = camp.conditions || {};
            if (typeof conds === 'string') {
                try { conds = JSON.parse(conds); } catch (e) { conds = {}; }
            }

            if (conds.couponCode && typeof conds.couponCode === 'string' && conds.couponCode.trim() !== '') {
                if (!discountCode || discountCode.trim().toUpperCase() !== conds.couponCode.trim().toUpperCase()) {
                    return false;
                }
            }

            if ((camp.type === 'payment_method_discount' || camp.type === 'loyalty_points') && paymentMode) {
                if (conds.paymentMethod && conds.paymentMethod !== '' && conds.paymentMethod !== paymentMode) {
                    return false;
                }
            }
            return true;
        });
    }, [campaigns, selectedCustomer, customers, paymentMode, discountCode]);

    const { computedCampaignDiscount, computedPromoItems, computedEarnedPoints } = useMemo(() => {
        let disc = 0;
        let pItems: any[] = [];
        let pts = 0;

        for (const camp of applicableCampaigns) {
            let conds: any = camp.conditions || {};
            if (typeof conds === 'string') {
                try { conds = JSON.parse(conds); } catch(e) { conds = {}; }
            }

            if (camp.type === 'payment_method_discount') {
                const isPaymentMatch = !conds.paymentMethod || conds.paymentMethod === '' || conds.paymentMethod === paymentMode;
                if (isPaymentMatch && paymentMode) {
                    disc += subtotal * (camp.discountRate || 0);
                }
            }
            else if (camp.type === 'buy_x_get_free') {
                cart.forEach(item => {
                    const reqQty = conds.buyQuantity || 1;
                    const rwdQty = conds.rewardQuantity || 1;
                    if (item.qty >= reqQty) {
                        const times = Math.floor(item.qty / reqQty);
                        pItems.push({ campName: camp.name, qty: times * rwdQty, prodId: conds.rewardProductId || item.id, originalName: item.name });
                    }
                });
            }
            else if (camp.type === 'loyalty_points') {
                const isPaymentMatch = !conds.paymentMethod || conds.paymentMethod === '' || conds.paymentMethod === paymentMode;
                if (isPaymentMatch) {
                    pts += subtotal * (camp.pointsRate || 0);
                }
            }
        }
        return { computedCampaignDiscount: disc, computedPromoItems: pItems, computedEarnedPoints: pts };
    }, [applicableCampaigns, cart, subtotal, paymentMode]);

    // Final Calculations
    const totalDiscount = (appliedDiscount || 0) + computedCampaignDiscount;
    const vatExcludedTotal = subtotal / 1.2;
    const finalTotal = Math.max(0, subtotal - totalDiscount - (pointsToUse || 0));

    // Finalize (Offline aware)
    const handleFinalize = async () => {
        if (cart.length === 0 || isProcessing) return;
        if (!paymentMode) return showWarning("Hata", "Lütfen bir ödeme yöntemi seçiniz.");
        if (terminalMode === 'b2b' && selectedCustomer === 'Perakende Müşteri') {
            return showWarning("Cari Seçimi Zorunlu", "Fatura kesebilmek için lütfen geçerli bir Kurumsal/Bireysel Müşteri seçiniz.");
        }

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
        if (paymentMode !== 'account' && !selectedKasa) {
            return showWarning("Hata", "Lütfen kasa/banka hesabı seçiniz. Sistemde kasa yoksa Finans modülünden Nakit/Banka hesabı oluşturun.");
        }

        const payload = {
            items: cart.map(i => ({ productId: i.id, qty: i.qty, price: getPrice(i) })),
            total: finalTotal,
            customerName: selectedCustomer,
            description: referenceNote ? `REF: ${referenceNote}` : `POS: ${selectedCustomer}`,
            paymentMode,
            kasaId: selectedKasa || 'CashKasa',
            customerId: customer?.id,
            discountAmount: totalDiscount,
            couponCode: discountCode,
            pointsUsed: pointsToUse || 0,
            installments: selectedTaksit ? parseInt(selectedTaksit.installment.replace(/\D/g, ''), 10) || 1 : undefined,
            installmentLabel: selectedTaksit?.installment || undefined
        };

        setIsProcessing(true);
        try {
            if (!isOnline) {
                addToQueue('sale', payload);
                showSuccess("Offline: İşlem kuyruğa alındı. Online olunca otomatik gönderilecek.", "");
                resetTerminalState();
                return;
            }

            const currentCustomerId = customer?.id;
            const res = await processSale(payload);
            if (res.success) {
                showSuccess("Satış Başarıyla Tamamlandı", "");
                resetTerminalState();
                if (currentCustomerId) {
                    router.push(`/customers/${currentCustomerId}`);
                }
            } else {
                showError("İşlem Reddedildi", res.error || "Satış kaydedilemedi.");
            }
        } catch (e: any) { showError("Hata", e.message || "Bilinmeyen hata"); }
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
        setSelectedTaksit(null);
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
        <div className="pos-terminal-scope flex flex-col flex-1 h-[calc(100vh-64px)] md:h-screen w-full bg-app dark:bg-[#020617] text-primary dark:text-white transition-colors duration-300 overflow-hidden">
            {/* SCOPE CSS (isolated) */}
            <style dangerouslySetInnerHTML={{
                __html: `
        .pos-terminal-scope { overflow-x: hidden; }
        .pos-terminal-scope * { outline-color: #6366f1 !important; }
      `}} />

            {/* TOP KPI STRIP (110px max) */}
            <div className="h-[110px] shrink-0 border-b border-default dark:border-white/5 bg-surface dark:bg-[#0B1220] flex items-center px-6 gap-6 shadow-enterprise z-10">
                <div className="flex flex-col">
                    <h1 className="text-xl font-black text-primary dark:text-white tracking-tight flex items-center gap-2">
                        <span className="text-primary dark:text-indigo-400 shrink-0">Terminal Workspace</span>
                    </h1>
                    <p className="text-xs font-semibold text-secondary dark:text-slate-400 mt-1 flex items-center gap-2">
                        {t('terminal.customer')}: <span className="text-primary dark:text-slate-300">{selectedCustomer}</span>
                    </p>
                </div>
                <div className="h-10 w-px bg-slate-200 dark:bg-white/10 mx-2 hidden md:block"></div>

                <div className="flex gap-4">
                    <div className="px-4 border-l border-[#EEF1F4] dark:border-white/5">
                        <span className="text-[10px] uppercase font-bold text-[#9CA3AF] block mb-1">{t('terminal.openAccount')}</span>
                        <span className="text-sm font-bold text-[#111827] dark:text-white">{Number(customer?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL</span>
                    </div>
                </div>

                <div className="ml-auto flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 border-r border-divider dark:border-white/10 pr-4 mr-2">
                        {/* Forex Toggle */}
                        <button 
                            onClick={() => updateAppSetting('useForexRate', !useForex)} 
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-colors ${useForex ? 'bg-sidebar-item-active dark:bg-indigo-500/10 border-primary/20 dark:border-indigo-500/20 text-primary dark:text-indigo-400 ring-2 ring-primary/30' : 'bg-sidebar-bg dark:bg-slate-800 border-default dark:border-white/5 text-secondary dark:text-slate-400 hover:bg-sidebar-item-hover dark:hover:bg-slate-700'}`}
                            title="Aktif olduğunda ürünlerin döviz kurları anlık olarak TL'ye çevrilerek satışı yapılır."
                        >
                            <span className="flex h-2 w-2 relative">
                                {useForex && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/75 opacity-75"></span>}
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${useForex ? 'bg-primary' : 'bg-text-muted'}`}></span>
                            </span>
                            Canlı Kur {useForex ? 'Açık' : 'Kapalı'}
                        </button>
                        <div className="h-6 w-px bg-divider dark:bg-white/10 mx-1"></div>
                        
                        <button onClick={() => setShowExtrasModal(true)} className="flex items-center gap-1.5 bg-sidebar-bg dark:bg-slate-800 hover:bg-sidebar-item-hover dark:hover:bg-slate-700 text-secondary dark:text-slate-300 px-3 py-1.5 rounded-xl border border-default dark:border-white/5 text-[11px] font-bold transition-colors">
                            <Tag size={12} /> {t('terminal.coupon')} {discountCode && <span className="w-1.5 h-1.5 rounded-full bg-state-error-text"></span>}
                        </button>
                        <button onClick={() => setShowExtrasModal(true)} className="flex items-center gap-1.5 bg-sidebar-bg dark:bg-slate-800 hover:bg-sidebar-item-hover dark:hover:bg-slate-700 text-secondary dark:text-slate-300 px-3 py-1.5 rounded-xl border border-default dark:border-white/5 text-[11px] font-bold transition-colors">
                            <Gift size={12} /> {t('terminal.points')} {pointsToUse > 0 && <span className="w-1.5 h-1.5 rounded-full bg-state-success-text"></span>}
                        </button>
                        <button onClick={() => setShowExtrasModal(true)} className="flex items-center gap-1.5 bg-sidebar-bg dark:bg-slate-800 hover:bg-sidebar-item-hover dark:hover:bg-slate-700 text-secondary dark:text-slate-300 px-3 py-1.5 rounded-xl border border-default dark:border-white/5 text-[11px] font-bold transition-colors">
                            <FileText size={12} /> {t('terminal.ref')} {referenceNote && <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>}
                        </button>
                    </div>

                    <button onClick={() => setShowResumptionModal(true)} className="flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 hover:bg-amber-100 px-3 py-1.5 rounded-full text-xs font-bold border border-amber-200 dark:border-amber-500/20 transition-colors">
                        <Clock size={14} /> {t('terminal.pending')} ({suspendedSales?.length || 0})
                    </button>
                    <OfflineBadge />
                </div>
            </div>

            {/* MODE SWITCHER TABS */}
            <div className="px-4 lg:px-6 pt-4 pb-0">
                <div className="flex bg-[#EEF1F4] dark:bg-[#0f172a] p-1.5 rounded-xl border border-slate-200/60 dark:border-white/5 shadow-inner w-max gap-1 overflow-x-auto custom-scrollbar">
                    <button onClick={() => setTerminalMode('pos')} className={`px-5 py-2 rounded-lg text-[11px] uppercase tracking-widest font-black transition-all whitespace-nowrap ${terminalMode==='pos' ? 'bg-white dark:bg-indigo-500/20 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>{t('terminal.quickSale')}</button>
                    <button onClick={() => setTerminalMode('eadisyon')} className={`px-5 py-2 rounded-lg text-[11px] uppercase tracking-widest font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${terminalMode==='eadisyon' ? 'bg-white dark:bg-orange-500/20 shadow-sm text-orange-600 dark:text-orange-400 border border-orange-200/50 dark:border-orange-500/30' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}><Utensils size={13} /> {t('terminal.restoPos')}</button>
                    <button onClick={() => setTerminalMode('b2b')} className={`px-5 py-2 rounded-lg text-[11px] uppercase tracking-widest font-black transition-all whitespace-nowrap ${terminalMode==='b2b' ? 'bg-white dark:bg-amber-500/20 shadow-sm text-amber-600 dark:text-amber-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>{t('terminal.eInvoice')}</button>
                    <button onClick={() => setTerminalMode('emustahsil')} className={`px-5 py-2 rounded-lg text-[11px] uppercase tracking-widest font-black transition-all whitespace-nowrap ${terminalMode==='emustahsil' ? 'bg-white dark:bg-emerald-500/20 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>{t('terminal.eMustahsil')}</button>
                    <button onClick={() => setTerminalMode('esmm')} className={`px-5 py-2 rounded-lg text-[11px] uppercase tracking-widest font-black transition-all whitespace-nowrap ${terminalMode==='esmm' ? 'bg-white dark:bg-purple-500/20 shadow-sm text-purple-600 dark:text-purple-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>{t('terminal.eSmm')}</button>
                </div>
            </div>

            {terminalMode === 'pos' ? (
                /* MAIN GRID - POS System */
                <div className="flex-1 flex flex-row gap-4 lg:gap-6 p-4 lg:p-6 pt-3 lg:pt-4 min-h-0 overflow-hidden">

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

                    <AiCashierPanel cartItems={cart} onAddSuggested={addToCart} allProducts={products} />

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
                        terminalMode={terminalMode}
                        handleFinalize={handleFinalize}
                        handleSuspend={() => {
                            if (cart.length === 0) return;
                            setSuspenseLabel('');
                            setShowSuspendModal(true);
                        }}
                        isProcessing={isProcessing}
                        isOnline={isOnline}
                        selectedTaksit={selectedTaksit}
                        setSelectedTaksit={setSelectedTaksit}
                        salesExpenses={salesExpenses}
                    />
                </div>
            </div>
            ) : terminalMode === 'b2b' ? (
                /* B2B INVOICE SYSTEM */
                <B2BInvoiceWorkspace products={products} customers={customers} />
            ) : terminalMode === 'emustahsil' ? (
                /* E-MÜSTAHSİL SYSTEM */
                <EMustahsilWorkspace products={products} customers={customers} />
            ) : terminalMode === 'esmm' ? (
                /* E-SMM SYSTEM */
                <ESMMWorkspace products={products} customers={customers} />
            ) : (
                /* RESTO-POS SYSTEM */
                <EAdisyonWorkspace products={products} />
            )}

            {/* MODALS */}
            {isCustomerModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-lg bg-[#FFFFFF] dark:bg-[#0f172a] rounded-2xl p-6 border border-[#D9DEE5] dark:border-white/10 shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-lg font-bold mb-4">{t('terminal.customerSelection')}</h3>
                        <input autoFocus placeholder={t('terminal.searchPlaceholder')} value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} className="w-full bg-[#F4F6F8] dark:bg-slate-900 border border-[#D6DAE1] dark:border-white/10 rounded-xl p-3 mb-4 focus:ring-2 focus:ring-[#2563EB] text-[#111827] dark:text-white" />
                        <div className="max-h-[300px] overflow-y-auto space-y-2">
                            <button onClick={() => { setSelectedCustomer('Perakende Müşteri'); setIsCustomerModalOpen(false); }} className="w-full text-left p-3 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">Perakende Müşteri</span>
                            </button>
                            {filteredCustomers.map(c => (
                                <button key={c.id} onClick={() => { setSelectedCustomer(c.name); setIsCustomerModalOpen(false); }} className="w-full text-left p-3 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex justify-between">
                                    <span className="font-bold truncate">{c.name}</span>
                                    <span className="text-xs text-slate-500">{Number(c.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL</span>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setIsCustomerModalOpen(false)} className="mt-4 w-full h-12 rounded-xl font-bold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10">{t('terminal.escClose')}</button>
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
                    <div className="w-full max-w-lg bg-[#FFFFFF] dark:bg-[#0f172a] rounded-2xl p-6 border border-[#D9DEE5] dark:border-white/10 shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-lg font-bold mb-4">{t('terminal.pendingSales')}</h3>
                        {(!suspendedSales || suspendedSales.length === 0) ? (
                            <div className="text-center opacity-50 py-8">{t('terminal.noPendingSales')}</div>
                        ) : (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {suspendedSales.map((sale: any) => (
                                    <div key={sale.id} className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 flex justify-between items-center">
                                        <div>
                                            <div className="font-bold text-amber-500">{sale.label}</div>
                                            <div className="text-xs opacity-50">{new Date(sale.timestamp).toLocaleTimeString()} - {sale.items?.length || 0} {t('terminal.productsText')}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="font-bold text-sm mr-2">₺{sale.total?.toLocaleString() || 0}</div>
                                            <button onClick={() => {
                                                setCart(sale.items.map((i: any) => ({ ...i.product, qty: i.qty })));
                                                setSelectedCustomer(sale.customer?.name || 'Perakende Müşteri');
                                                removeSuspendedSale(sale.id);
                                                setShowResumptionModal(false);
                                            }} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700">{t('terminal.openBtn')}</button>
                                            <button onClick={() => removeSuspendedSale(sale.id)} className="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20">{t('terminal.deleteBtn')}</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button onClick={() => setShowResumptionModal(false)} className="mt-4 w-full h-12 rounded-xl font-bold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10">{t('terminal.escClose')}</button>
                    </div>
                </div>
            )}

            {showSuspendModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-md bg-white dark:bg-[#0f172a] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-2xl">
                        <h3 className="text-xl font-bold mb-4">{t('terminal.suspendSale')}</h3>
                        <input autoFocus placeholder={t('terminal.suspendLabelPlaceholder')} value={suspenseLabel} onChange={e => setSuspenseLabel(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-3 mb-4 focus:ring-2 focus:ring-indigo-500" />
                        <div className="flex gap-2">
                            <button onClick={() => setShowSuspendModal(false)} className="flex-1 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-white/20">{t('common.cancel')}</button>
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-white dark:bg-[#0B1220] rounded-[24px] p-6 lg:p-8 shadow-2xl shadow-indigo-900/10 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[17px] font-black tracking-tight text-slate-900 dark:text-white">{t('terminal.extrasDiscounts')}</h3>
                            <button onClick={() => setShowExtrasModal(false)} className="opacity-50 hover:opacity-100 p-2 -mr-2 transition-opacity">✕</button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-slate-50/50 dark:bg-white/[0.02] p-4 rounded-2xl">
                                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-2 uppercase tracking-widest pl-1">{t('terminal.cartDiscount')} (₺)</label>
                                <div className="relative">
                                    <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input type="number" min="0" value={appliedDiscount || ''} onChange={e => setAppliedDiscount(Number(e.target.value))} className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#0f172a] shadow-sm rounded-xl font-bold text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all border-none" placeholder="0.00" />
                                </div>
                            </div>

                            <div className="bg-slate-50/50 dark:bg-white/[0.02] p-4 rounded-2xl">
                                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-2 uppercase tracking-widest pl-1">Kupon Kodu</label>
                                <div className="relative flex gap-2">
                                    <input type="text" value={discountCode} onChange={e => setDiscountCode(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-[#0f172a] shadow-sm rounded-xl font-bold text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 uppercase transition-all border-none" placeholder={t('terminal.enterCode')} />
                                </div>
                            </div>

                            <div className="bg-slate-50/50 dark:bg-white/[0.02] p-4 rounded-2xl">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">{t('terminal.usePoints')}</label>
                                    <span className="text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-2 py-0.5 rounded-full">{customer?.points || 0} {t('terminal.available')}</span>
                                </div>
                                <div className="relative">
                                    <Gift className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500" size={18} />
                                    <input type="number" max={customer?.points || 0} min="0" value={pointsToUse || ''} onChange={e => setPointsToUse(Number(e.target.value))} className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#0f172a] shadow-sm rounded-xl font-bold text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/20 transition-all border-none" placeholder="0" />
                                </div>
                            </div>

                            <div className="bg-slate-50/50 dark:bg-white/[0.02] p-4 rounded-2xl">
                                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-2 uppercase tracking-widest pl-1">{t('terminal.orderNote')}</label>
                                <div className="relative">
                                    <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input type="text" value={referenceNote} onChange={e => setReferenceNote(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#0f172a] shadow-sm rounded-xl font-bold text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all border-none" placeholder={t('terminal.notePlaceholder')} />
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setShowExtrasModal(false)} className="mt-8 w-full py-4 text-sm rounded-xl font-bold bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-500 shadow-md shadow-slate-900/10 dark:shadow-indigo-500/20 transition-all focus:ring-4 focus:ring-slate-900/10 dark:focus:ring-indigo-500/10">{t('terminal.confirm')}</button>
                    </div>
                </div>
            )}

            {showCheckoutModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
                        <h3 className="text-xl font-black mb-4 flex items-center gap-2 tracking-tight"><CreditCard className="text-indigo-500" /> {t('terminal.completePayment')}</h3>

                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-5 rounded-2xl mb-6 shadow-sm">
                            <div className="flex justify-between text-sm font-bold text-slate-500 mb-2"><span>{t('terminal.cartSubtotal')}</span><span>₺{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                            {(appliedDiscount > 0 || pointsToUse > 0) && (
                                <div className="flex justify-between text-sm font-bold text-emerald-500 mb-2"><span>{t('terminal.manualDiscount')}</span><span>-₺{(appliedDiscount + (pointsToUse || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                            )}

                            {/* Campaign Engine Rewards inside Checkout Summary */}
                            {(computedCampaignDiscount > 0 || computedEarnedPoints > 0 || (computedPromoItems && computedPromoItems.length > 0)) && (
                                <div className="mt-3 mb-3 p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                                    <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-2 uppercase tracking-widest flex items-center gap-1.5">
                                        <Gift size={12} /> {t('terminal.autoRewards')}
                                    </div>
                                    <div className="space-y-1.5 text-xs">
                                        {computedCampaignDiscount > 0 && (
                                            <div className="flex justify-between font-medium text-emerald-600 dark:text-emerald-400">
                                                <span>{t('terminal.campaignDiscount')}</span>
                                                <span>-₺{computedCampaignDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        )}
                                        {computedEarnedPoints > 0 && (
                                            <div className="flex justify-between font-medium text-amber-600 dark:text-amber-400">
                                                <span>{t('terminal.pointsToEarn')}</span>
                                                <span>+{computedEarnedPoints.toLocaleString(undefined, { maximumFractionDigits: 2 })} Puan</span>
                                            </div>
                                        )}
                                        {computedPromoItems?.map((pItem: any, i: number) => (
                                            <div key={i} className="flex justify-between font-medium text-blue-600 dark:text-blue-400">
                                                <span className="truncate pr-2">{pItem.qty}x {pItem.campName}</span>
                                                <span>{t('terminal.freeInCart')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="h-px w-full bg-slate-200 dark:bg-white/10 my-3"></div>
                            <div className="flex justify-between text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight"><span>{t('terminal.grandTotal')}</span><span>₺{finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                        </div>

                        {paymentMode !== 'account' && (
                            <div className="mb-6">
                                <label className="text-[10px] font-bold opacity-50 uppercase tracking-widest block mb-3">{t('terminal.selectVaultBank')}</label>
                                <div className="grid grid-cols-2 gap-3 max-h-[160px] overflow-y-auto pr-1">
                                    {(kasalar || []).filter((k: any) => {
                                        if (paymentMode === 'cash') return k.type === 'Nakit';
                                        if (paymentMode === 'card') return k.type === 'Kredi Kartı' || k.type?.includes('POS');
                                        if (paymentMode === 'transfer') return k.type === 'Banka' || k.type === 'Havale/EFT' || (!k.type?.includes('POS') && k.type !== 'Nakit' && k.type !== 'Kredi Kartı');
                                        return true;
                                    }).map((k: any) => (
                                        <button
                                            key={k.id}
                                            onClick={() => setSelectedKasa(k.id)}
                                            className={`p-4 rounded-xl border flex flex-col justify-center transition-all shadow-sm ${selectedKasa === k.id ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 ring-2 ring-indigo-500/50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'}`}
                                        >
                                            <span className={`text-sm font-bold truncate block w-full text-left ${selectedKasa === k.id ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>{k.name}</span>
                                            <span className={`text-[10px] mt-1 text-left uppercase font-bold tracking-widest ${selectedKasa === k.id ? 'text-indigo-500 dark:text-indigo-500/70' : 'text-slate-400 dark:text-slate-500'}`}>{k.currency || 'TRY'} • {t('terminal.balance')}: {Number(k.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </button>
                                    ))}
                                    {(!(kasalar || []).filter((k: any) => {
                                        if (paymentMode === 'cash') return k.type === 'Nakit';
                                        if (paymentMode === 'card') return k.type === 'Kredi Kartı' || k.type?.includes('POS');
                                        if (paymentMode === 'transfer') return k.type === 'Banka' || k.type === 'Havale/EFT' || (!k.type?.includes('POS') && k.type !== 'Nakit' && k.type !== 'Kredi Kartı');
                                        return true;
                                    }).length) && (
                                        <div className="col-span-2 text-sm text-center py-4 bg-slate-50 dark:bg-[#0f172a] rounded-xl text-slate-500 border border-slate-200 dark:border-white/5 font-medium">{t('terminal.noVaultFound')}</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {paymentMode === 'card' && Array.isArray(salesExpenses?.posCommissions) && salesExpenses.posCommissions.length > 0 && (
                            <div className="mb-6">
                                <label className="text-[10px] font-bold opacity-50 uppercase tracking-widest block mb-3">{t('terminal.selectInstallment')}</label>
                                <div className="grid grid-cols-2 gap-3 max-h-[160px] overflow-y-auto pr-1">
                                    {salesExpenses.posCommissions.map((comm: any, idx: number) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedTaksit(comm)}
                                            className={`p-3 rounded-xl border flex flex-col justify-center transition-all shadow-sm ${selectedTaksit?.installment === comm.installment ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 ring-2 ring-amber-500/50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'}`}
                                        >
                                            <span className={`text-sm font-bold truncate block w-full text-left ${selectedTaksit?.installment === comm.installment ? 'text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>{comm.installment}</span>
                                            <span className={`text-[10px] mt-1 text-left uppercase font-bold tracking-widest ${selectedTaksit?.installment === comm.installment ? 'text-amber-600 dark:text-amber-500/70' : 'text-slate-400 dark:text-slate-500'}`}>{t('terminal.deduction')}: %{comm.rate}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setShowCheckoutModal(false)} className="flex-1 py-4 font-bold rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">{t('terminal.cancelGiveUp')}</button>
                            <button onClick={executeSale} disabled={isProcessing} className="flex-1 py-4 font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-md shadow-indigo-600/20 text-[15px]">
                                {isProcessing ? t('terminal.processing') : t('terminal.confirmFinish')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
