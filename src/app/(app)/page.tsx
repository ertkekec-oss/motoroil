"use client";

import { useState, useEffect, useMemo, Suspense, useCallback, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';
import { useFinancials } from '@/contexts/FinancialContext';
import { useInventory } from '@/contexts/InventoryContext';
import { useCRM } from '@/contexts/CRMContext';
import { useSales } from '@/contexts/SalesContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useUpsell } from '@/hooks/useUpsell';
import dynamic from 'next/dynamic';

const LoginPageContent = dynamic(() => import('@/components/login/LoginPageContent'), { ssr: false });

function POSContent() {
  const router = useRouter();
  const { currentUser, activeBranchName } = useApp();
  const { products, stockTransfers } = useInventory();
  const { kasalar, transactions, refreshTransactions } = useFinancials();
  const { customers, refreshCustomers } = useCRM();
  const { processSale, suspendedSales, suspendSale, removeSuspendedSale } = useSales();
  const { campaigns, referralSettings, appSettings } = useSettings();
  const { showSuccess, showError, showWarning, showConfirm } = useModal();
  const { checkUpsell } = useUpsell();
  const { isAuthenticated } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  // --- STATES ---
  const [cart, setCart] = useState<any[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('Perakende Müşteri');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'card' | 'transfer' | 'account' | null>(null);
  const [installmentCount, setInstallmentCount] = useState(1);
  const [selectedKasa, setSelectedKasa] = useState<string | number>('');

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspenseLabel, setSuspenseLabel] = useState('');
  const [showResumptionModal, setShowResumptionModal] = useState(false);

  // Promo
  const [showPromoInputs, setShowPromoInputs] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [pointsToUse, setPointsToUse] = useState(0);
  const [validCoupon, setValidCoupon] = useState<any>(null);
  const [referenceCode, setReferenceCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [discountValue, setDiscountValue] = useState(0);

  // Data
  const [insightsData, setInsightsData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activePriceListId, setActivePriceListId] = useState<string | null>(null);
  const [activePriceListName, setActivePriceListName] = useState<string | null>(null);
  const [priceMap, setPriceMap] = useState<Record<string, number>>({});
  const [posTheme, setPosTheme] = useState<'dark' | 'light'>('dark');

  const getPrice = useCallback((product: any) => {
    if (priceMap[product.id] !== undefined) return priceMap[product.id];
    return Number(product.price || 0);
  }, [priceMap]);

  // --- EFFECTS ---

  // CSS Fix
  useEffect(() => {
    document.body.style.background = 'var(--bg-deep)';
    document.body.style.fontFamily = "'Outfit', 'Inter', sans-serif";
    document.body.style.color = 'var(--text-main)';
  }, []);

  // Fetch Insights
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchInsights = async () => {
      try {
        const res = await fetch('/api/user/insights');
        const data = await res.json();
        setInsightsData(data);
      } catch (e) { console.error(e) }
    };
    fetchInsights();
  }, [isAuthenticated]);

  // Handle POS Theme persistence
  useEffect(() => {
    const savedTheme = localStorage.getItem('pos-theme') as 'dark' | 'light';
    if (savedTheme) setPosTheme(savedTheme);
  }, []);

  const togglePosTheme = () => {
    const newTheme = posTheme === 'dark' ? 'light' : 'dark';
    setPosTheme(newTheme);
    localStorage.setItem('pos-theme', newTheme);
  };

  // Auto Focus
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Auto Select Kasa
  useEffect(() => {
    if (!paymentMode || paymentMode === 'account') { setSelectedKasa(''); return; }

    const filtered = (kasalar || []).filter(k =>
      (!k.branch || k.branch === 'Global' || k.branch === activeBranchName) &&
      ((paymentMode === 'cash' && k.type === 'Nakit') ||
        (paymentMode === 'card' && (k.type === 'Kredi Kartı' || k.type?.includes('POS'))) ||
        (paymentMode === 'transfer' && (k.type === 'Banka' || k.type === 'Havale')))
    );

    if (filtered.length === 1) setSelectedKasa(filtered[0].id);
    else if (selectedKasa && !filtered.find(f => String(f.id) === String(selectedKasa))) setSelectedKasa('');
    if (filtered.length === 1) setSelectedKasa(filtered[0].id);
    else if (selectedKasa && !filtered.find(f => String(f.id) === String(selectedKasa))) setSelectedKasa('');
  }, [paymentMode, kasalar, activeBranchName]);

  // Resolve Customer Price List
  useEffect(() => {
    const resolvePriceList = async () => {
      if (!selectedCustomer) return;
      const cust = customers.find(c => c.name === selectedCustomer);
      const customerId = cust?.id;

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
            // Fetch prices for this list
            const pRes = await fetch(`/api/pricing/lists/${listId}/prices`);
            const pData = await pRes.json();
            if (pData.success) {
              const newPriceMap = pData.data.priceMap || {};
              setPriceMap(newPriceMap);

              // 🔄 BUG FIX: Update existing cart items with new prices
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

    resolvePriceList();
  }, [selectedCustomer, customers]);


  // --- COMPUTED ---
  const stats = useMemo(() => {
    const criticalStockCount = (products || []).filter(p => Number(p.stock) <= Number(p.minStock || 5)).length;
    const inTransitCount = (stockTransfers || []).filter(t => t.status === 'IN_TRANSIT').length;
    const waitingSales = suspendedSales?.length || 0;
    return { criticalStock: criticalStockCount, inTransit: inTransitCount, waitingSales };
  }, [products, stockTransfers, suspendedSales]);

  // Product Filter
  const filteredProducts = useMemo(() => {
    if (!searchInput || searchInput.length < 2) return [];
    return (products || []).filter(p =>
      (p.name?.toLowerCase().includes(searchInput.toLowerCase())) ||
      (p.barcode?.includes(searchInput))
    ).slice(0, 10);
  }, [products, searchInput]);

  // Customer Filter
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return (customers || []).slice(0, 20);
    return (customers || []).filter(c => c.name?.toLowerCase().includes(customerSearch.toLowerCase()));
  }, [customers, customerSearch]);

  const addToCart = useCallback((product: any) => {
    setCart(prev => {
      const exist = prev.find(i => i.id === product.id);
      if (exist) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      // Use resolved price
      const resolvedPrice = getPrice(product);
      return [...prev, { ...product, price: resolvedPrice, qty: 1 }];
    });
    setSearchInput(''); inputRef.current?.focus();
  }, [getPrice]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput) return;
    const prod = products.find(p => p.barcode === searchInput || p.code === searchInput);
    if (prod) addToCart(prod);
    else if (filteredProducts.length === 1) addToCart(filteredProducts[0]);
    else showWarning("Bulunamadı", "Ürün bulunamadı");
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price || 0) * item.qty), 0);
  const manualDiscount = discountType === 'percent' ? (subtotal * discountValue / 100) : discountValue;
  const couponDiscount = validCoupon ? (validCoupon.type === 'amount' ? validCoupon.value : (subtotal * (validCoupon.value / 100))) : 0;

  const campaignDiscount = useMemo(() => {
    if (!paymentMode) return 0;
    const cmap: any = { 'cash': 'cash', 'card': 'card_single', 'transfer': 'transfer' };
    const targetMode = cmap[paymentMode];

    const activeCampaigns = (campaigns || []).filter(c =>
      c.isActive && c.type === 'payment_method_discount' && c.conditions.paymentMethod === targetMode
    );

    if (activeCampaigns.length === 0) return 0;
    let totalDiscount = 0;
    activeCampaigns.forEach(camp => {
      const rate = camp.discountRate || 0;
      if (rate > 0) totalDiscount += (subtotal * rate);
    });
    return totalDiscount;
  }, [paymentMode, campaigns, cart, subtotal]);

  const totalDiscount = manualDiscount + couponDiscount + pointsToUse + campaignDiscount;
  const vatExcludedTotal = subtotal / 1.2;
  const finalTotal = Math.max(0, subtotal - totalDiscount);
  const customer = customers.find(c => c.name === selectedCustomer);

  const processingRef = useRef(false);

  // --- HANDLERS ---
  const handleFinalize = async () => {
    if (cart.length === 0 || processingRef.current || isProcessing) return;
    if (!paymentMode) return showWarning("Hata", "Lütfen bir ödeme yöntemi seçiniz.");
    if (paymentMode !== 'account' && !selectedKasa) return showWarning("Hata", "Lütfen kasa/banka seçiniz.");
    if (paymentMode === 'account' && selectedCustomer === 'Perakende Müşteri') return showWarning("Hata", "Perakende müşterisine veresiye satılamaz.");

    const canContinue = await checkUpsell('INVOICE_PAGE');
    if (!canContinue) return;

    processingRef.current = true;
    setIsProcessing(true);
    try {
      const success = await processSale({
        items: cart.map(i => ({ productId: i.id, qty: i.qty })),
        total: finalTotal,
        customerName: selectedCustomer,
        description: `POS: ${selectedCustomer}`,
        paymentMode,
        kasaId: selectedKasa || 'CashKasa',
        customerId: customer?.id,
        discountAmount: totalDiscount,
        pointsUsed: pointsToUse,
        couponCode: validCoupon?.code,
        referenceCode: referenceCode,
        installments: installmentCount > 1 ? installmentCount : undefined
      });
      if (success) {
        showSuccess("Başarılı", "Satış tamamlandı");
        setCart([]); setPaymentMode(null); setPointsToUse(0); setValidCoupon(null); setDiscountValue(0); setReferenceCode('');

        // Redirect to Customer Detail Page if not retail
        if (selectedCustomer !== 'Perakende Müşteri' && customer?.id) {
          router.push(`/customers/${customer.id}`);
        } else {
          // Reset to Retail if anonymous
          setSelectedCustomer('Perakende Müşteri');
        }
      } else {
        showError("Hata", "Satış kaydedilemedi.");
      }
    } catch (e: any) { showError("Hata", e.message); }
    finally {
      setIsProcessing(false);
      processingRef.current = false;
    }
  };

  const handleValidateCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await fetch(`/api/coupons?code=${couponCode}`);
      const coupon = await res.json();
      if (!coupon || coupon.error) return showError('Hata', 'Geçersiz kupon.');
      setValidCoupon(coupon);
      showSuccess('Başarılı', 'Kupon başarıyla uygulandı!');
    } catch (e) { showError('Hata', 'Kupon hatası.'); }
  };

  const handleApplyReference = () => {
    if (!referenceCode) return;
    const referrer = customers.find(c => c.referralCode?.toUpperCase() === referenceCode.toUpperCase());
    if (referrer) {
      showSuccess("Geçerli", `${referrer.name} referansı uygulandı!`);
      if (referralSettings?.refereeGift > 0) {
        setDiscountType('amount');
        setDiscountValue(referralSettings.refereeGift);
      }
    } else showError("Hata", "Geçersiz kod.");
  };

  const handleSuspend = () => {
    if (!suspenseLabel) return showWarning("Hata", "Bir etiket (isim) giriniz.");
    suspendSale(suspenseLabel, cart.map(i => ({ product: i, qty: i.qty })), customer, finalTotal);
    setCart([]); setSuspenseLabel(''); setShowSuspendModal(false);
    showSuccess("Başarılı", "Satış askıya alındı");
  };

  const handleResume = (sale: any) => {
    setCart(sale.items.map((i: any) => ({ ...i.product, qty: i.qty })));
    setSelectedCustomer(sale.customer?.name || 'Perakende Müşteri');
    removeSuspendedSale(sale.id);
    setShowResumptionModal(false);
  };


  return (
    <div data-pos-theme={posTheme} className="flex flex-mobile-col w-full min-h-screen gap-4 p-4 text-pos bg-pos transition-colors duration-300">

      {/* LEFT MAIN AREA */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">

        {/* ROW 1: USER WELCOME */}
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black mb-1">Hoş geldin, <span className="text-primary">{currentUser?.name?.split(' ')[0]}</span> 👋</h2>
              <p className="text-xs opacity-50">Sistemdeki genel durumun ve sana özel ipuçları aşağıda.</p>
            </div>
            <button
              onClick={togglePosTheme}
              className="p-3 rounded-xl glass border border-pos hover:bg-white/10 transition-all text-xl shadow-pos"
              title={posTheme === 'dark' ? 'Aydınlık Mod' : 'Karanlık Mod'}
            >
              {posTheme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {/* ROW 2: CHARTS & NOTIFICATIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full md:h-auto">
          <div className={posTheme === 'light' ? "lg:col-span-6 bg-white border border-border-pos rounded-2xl p-4 shadow-pos min-h-[160px]" : "lg:col-span-6 bg-[#0f111a] border border-white/5 rounded-2xl p-4 shadow-2xl min-h-[160px]"}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2"><span className="text-lg">📈</span><span className="text-xs font-bold opacity-70">HAFTALIK TREND</span></div>
            </div>
            {insightsData?.stats?.weeklyTrend ? (
              <ResponsiveContainer width="100%" aspect={2.8}><AreaChart data={insightsData.stats.weeklyTrend}><Area type="monotone" dataKey="value" stroke="#FF5500" fill="#FF5500" fillOpacity={0.1} strokeWidth={2} /></AreaChart></ResponsiveContainer>
            ) : <div className="h-24 flex items-center justify-center text-xs opacity-30">Veri yükleniyor...</div>}
          </div>

          <div className={posTheme === 'light' ? "lg:col-span-3 bg-white border border-border-pos rounded-2xl p-4 shadow-pos min-h-[160px]" : "lg:col-span-3 bg-[#0f111a] border border-white/5 rounded-2xl p-4 shadow-2xl min-h-[160px]"}>
            <div className="flex items-center gap-2 mb-2"><span className="text-lg">🍰</span><span className="text-xs font-bold opacity-70">DAĞILIM</span></div>
            {insightsData?.stats?.categoryAnalysis ? (
              <ResponsiveContainer width="100%" height={100}><PieChart><Pie data={insightsData.stats.categoryAnalysis} innerRadius={25} outerRadius={35} dataKey="value"><Cell fill="#FF5500" /></Pie></PieChart></ResponsiveContainer>
            ) : <div className="h-24 flex items-center justify-center text-xs opacity-30">Veri yükleniyor...</div>}
          </div>

          <div onClick={() => router.push('/notifications')} className="lg:col-span-3 bg-gradient-to-br from-amber-500/20 to-orange-600/10 border border-amber-500/30 rounded-2xl p-4 shadow-lg min-h-[160px] relative cursor-pointer hover:scale-[1.02] transition-transform flex flex-col justify-center">
            <div className="text-[10px] font-bold text-amber-500 mb-1">BİLDİRİMLER</div>
            <div className="text-4xl font-black text-amber-500">{stats.criticalStock + stats.inTransit}</div>
            <div className="text-[10px] opacity-60 mt-1">Kritik Stok & Bekleyen</div>
          </div>
        </div>

        {/* ROW 2: CHARTS & NOTIFICATIONS (Grid adjusted) */}

        {/* ROW 4: SEARCH + ACTIONS */}
        <div className="flex flex-wrap gap-4">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 bg-white/5 p-1.5 rounded-xl border border-white/5 relative items-center min-w-[300px]">
            <input
              ref={inputRef} type="text" placeholder="Barkod, ürün adı veya kod..."
              value={searchInput} onChange={e => setSearchInput(e.target.value)}
              className="flex-1 bg-transparent border-none px-4 text-sm text-white focus:outline-none"
            />
            <button type="submit" className="bg-primary hover:bg-orange-600 text-white px-6 py-2 rounded-lg text-xs font-bold transition-colors">EKLE</button>

            {/* DYNAMIC PRODUCT LIST */}
            {filteredProducts.length > 0 && (
              <div className={posTheme === 'light' ? "absolute top-full left-0 right-0 mt-2 bg-white border border-border-pos rounded-xl overflow-hidden shadow-pos z-50 animate-in fade-in zoom-in-95 duration-100 max-h-[300px] overflow-y-auto" : "absolute top-full left-0 right-0 mt-2 bg-[#0f111a] border border-white/5 rounded-xl overflow-hidden shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 max-h-[300px] overflow-y-auto"}>
                {filteredProducts.map(p => (
                  <div key={p.id} onClick={() => addToCart(p)} className="p-3 border-b border-white/5 flex justify-between hover:bg-white/10 cursor-pointer">
                    <div><div className="font-bold text-sm">{p.name}</div><div className="text-[10px] opacity-50">{p.barcode}</div></div>
                    <div className="font-bold text-primary">₺{Number(getPrice(p)).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </form>

          <div onClick={() => setShowResumptionModal(true)} className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 flex flex-col justify-center min-w-[100px] cursor-pointer hover:bg-amber-500/20 transition-all">
            <div className="text-[9px] font-bold text-amber-500 opacity-80">BEKLEYEN</div>
            <div className="text-xl font-black text-amber-500">{stats.waitingSales}</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 flex flex-col justify-center min-w-[100px]">
            <div className="text-[9px] font-bold text-red-500 opacity-80">KRİTİK</div>
            <div className="text-xl font-black text-red-500">{stats.criticalStock}</div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2 flex flex-col justify-center min-w-[100px]">
            <div className="text-[9px] font-bold text-blue-500 opacity-80">YOLDAKİ</div>
            <div className="text-xl font-black text-blue-500">{stats.inTransit}</div>
          </div>
        </div>

        {/* CART */}
        <div className={posTheme === 'light' ? "flex-1 bg-white rounded-xl border border-border-pos p-2 overflow-y-auto min-h-[300px] shadow-pos" : "flex-1 bg-[#0f111a] rounded-xl border border-white/5 p-2 overflow-y-auto min-h-[300px] shadow-2xl"}>
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20"><span className="text-6xl mb-4">🛒</span><span className="text-sm font-bold">Sepet Boş</span></div>
          ) : (
            <div className="space-y-2">
              {cart.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{item.name}</div>
                    <div className="text-[10px] opacity-40">{item.barcode}</div>
                  </div>
                  <div className="flex items-center gap-2 bg-black/20 rounded-lg p-1">
                    <button onClick={() => setCart(c => c.map((x, i) => i === idx ? { ...x, qty: Math.max(1, x.qty - 1) } : x))} className="w-6 h-6 hover:bg-white/10 rounded">-</button>
                    <span className="w-6 text-center font-bold text-sm">{item.qty}</span>
                    <button onClick={() => setCart(c => c.map((x, i) => i === idx ? { ...x, qty: x.qty + 1 } : x))} className="w-6 h-6 hover:bg-white/10 rounded">+</button>
                  </div>
                  <div className="font-bold text-primary min-w-[80px] text-right">₺{(item.price * item.qty).toLocaleString()}</div>
                  <button onClick={() => setCart(c => c.filter((_, i) => i !== idx))} className="text-red-500 hover:bg-red-500/10 w-8 h-8 rounded flex items-center justify-center">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ROW 5: INSIGHTS & FORECAST (Moved below cart) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={posTheme === 'light' ? "bg-white border border-border-pos p-4 rounded-xl flex items-center gap-4 relative overflow-hidden group transition-all shadow-pos cursor-pointer" : "bg-[#0f111a] border border-white/5 p-4 rounded-xl flex items-center gap-4 relative overflow-hidden group hover:border-white/10 transition-all cursor-pointer"}>
            <div className="text-3xl">📄</div>
            <div>
              <div className="font-bold text-sm mb-1">E-Fatura'ya Geçin</div>
              <div className="text-[10px] opacity-60 leading-relaxed">Henüz resmi fatura kesmediniz. Entegrasyonu tamamlayın.</div>
              <div className="text-[10px] text-primary font-bold mt-2 group-hover:underline">Entegrasyonu Tamamla ➔</div>
            </div>
          </div>
          <div className={posTheme === 'light' ? "bg-white border border-border-pos p-4 rounded-xl flex items-center gap-4 relative overflow-hidden shadow-pos" : "bg-[#0f111a] border border-white/5 p-4 rounded-xl flex items-center gap-4 relative overflow-hidden"}>
            <div className="text-3xl">💡</div>
            <div>
              <div className="font-bold text-sm mb-1">Verimlilik Saati</div>
              <div className="text-[10px] opacity-60 leading-relaxed">İstatistiklerinize göre en verimli saatiniz öğleden önce 10:00.</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={posTheme === 'light' ? "bg-white border border-border-pos p-4 rounded-xl flex justify-between items-center relative overflow-hidden shadow-pos" : "bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/30 p-4 rounded-xl flex justify-between items-center relative overflow-hidden"}>
            <div><div className="text-[10px] font-bold text-indigo-400 mb-1 uppercase">GELECEK HAFTA</div><div className="text-2xl font-black">₺{insightsData?.stats?.forecast?.nextWeekRevenue?.toLocaleString() || '0'}</div></div>
            <div className="text-right"><div className="text-[10px] opacity-50">Güven Skoru</div><div className="text-xs font-bold text-white">%{insightsData?.stats?.forecast?.confidence || 0}</div></div>
          </div>

          <div className={posTheme === 'light' ? "bg-white border border-border-pos p-4 rounded-xl flex justify-between items-center relative overflow-hidden shadow-pos" : "bg-gradient-to-br from-emerald-900 to-slate-900 border border-emerald-500/30 p-4 rounded-xl flex justify-between items-center relative overflow-hidden"}>
            <div><div className="text-[10px] font-bold text-emerald-400 mb-1 uppercase">BÜYÜME HIZI</div><div className="text-2xl font-black">%{insightsData?.stats?.docGrowth || 0}</div></div>
            <div className="text-right"><div className="text-[10px] opacity-50">Fatura Artışı</div><div className="text-xs font-bold text-white">{insightsData?.stats?.thisMonthDocs || 0} Adet</div></div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL (Payment) */}
      <div className={posTheme === 'light' ? "w-[380px] bg-white border border-border-pos rounded-2xl p-6 flex flex-col shadow-pos sticky top-4 h-[calc(100vh-2rem)] overflow-hidden" : "w-[380px] bg-[#0f111a] border border-white/5 rounded-2xl p-6 flex flex-col shadow-2xl sticky top-4 h-[calc(100vh-2rem)] overflow-hidden"}>
        <h2 className="text-xs font-bold opacity-50 mb-6 tracking-widest text-center shrink-0">SATIŞ ÖZETİ</h2>

        {/* Scrollable Middle Section (Scrollbar hidden) */}
        <div className="flex-1 overflow-y-auto pr-0 space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* Customer */}
          <div className="mb-4">
            <label className="text-[10px] font-bold opacity-50 block mb-2 uppercase">MÜŞTERİ</label>
            <div onClick={() => setIsCustomerModalOpen(true)} className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5 cursor-pointer hover:border-white/20 transition-all">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px]">{selectedCustomer.charAt(0)}</div>
                <span className="font-bold text-sm truncate max-w-[200px]">{selectedCustomer}</span>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-[10px] text-primary font-bold">DEĞİŞTİR ▾</div>
                {activePriceListName && (
                  <div className="text-[8px] opacity-70 mt-0.5 bg-primary/10 px-1 rounded border border-primary/20 uppercase">
                    {activePriceListName}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Promo */}
          <button onClick={() => setShowPromoInputs(!showPromoInputs)} className="w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/20 p-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2">
            🎁 KOD VEYA REFERANS UYGULA
          </button>

          {showPromoInputs && (
            <div className="space-y-2 bg-black/20 p-2 rounded-lg animate-in slide-in-from-top-2">
              <div className="flex gap-1">
                <input placeholder="Kupon Kodu" value={couponCode} onChange={e => setCouponCode(e.target.value)} className="flex-1 bg-white/5 rounded px-2 text-xs h-8" />
                <button onClick={handleValidateCoupon} className="bg-white/10 px-2 text-[10px] rounded">DOĞRULA</button>
              </div>
              <div className="flex gap-1">
                <input placeholder="Referans" value={referenceCode} onChange={e => setReferenceCode(e.target.value)} className="flex-1 bg-white/5 rounded px-2 text-xs h-8" />
                <button onClick={handleApplyReference} className="bg-white/10 px-2 text-[10px] rounded">UYGULA</button>
              </div>
            </div>
          )}

          {/* Manual Discount & Points */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div>
              <label className="text-[9px] font-bold opacity-50 block mb-1">İNDİRİM</label>
              <div className="flex bg-black/20 rounded border border-white/5 overflow-hidden">
                <input type="number" value={discountValue} onChange={e => setDiscountValue(Number(e.target.value))} className="w-full bg-transparent border-none text-right px-2 text-xs h-8" />
                <button onClick={() => setDiscountType(t => t === 'percent' ? 'amount' : 'percent')} className="bg-primary px-2 text-[10px] font-bold">{discountType === 'percent' ? '%' : '₺'}</button>
              </div>
            </div>
            <div>
              <label className="text-[9px] font-bold opacity-50 block mb-1">PUAN</label>
              <input type="number" value={pointsToUse} onChange={e => setPointsToUse(Number(e.target.value))} className="w-full bg-black/20 border border-white/5 rounded px-2 text-xs h-8 text-right" />
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-2 border-t border-white/10 pt-4 mt-4">
            <div className="flex justify-between text-xs opacity-60"><span>Ara Toplam</span><span>₺{subtotal.toLocaleString()}</span></div>
            {totalDiscount > 0 && <div className="flex justify-between text-xs text-green-400"><span>İndirim</span><span>-₺{totalDiscount.toLocaleString()}</span></div>}
            <div className="flex justify-between text-xs opacity-40"><span>KDV Hariç</span><span>₺{vatExcludedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between items-end pt-2">
              <span className="font-bold text-sm">TOPLAM</span>
              <span className="text-3xl font-black text-primary">₺{finalTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="pt-4 border-t border-white/10 mt-4 overflow-hidden">
            <div className="flex justify-between items-center text-[10px] font-bold opacity-50 mb-2">
              <span>ÖDEME YÖNTEMİ</span>
              {paymentMode && paymentMode !== 'account' && (
                <select value={selectedKasa} onChange={e => setSelectedKasa(e.target.value)} className="bg-transparent border-none text-right text-[10px] text-primary focus:outline-none max-w-[150px] truncate">
                  <option value="" className="bg-black">Kasa Seçin</option>
                  {kasalar?.filter(k =>
                    (paymentMode === 'cash' && k.type === 'Nakit') ||
                    (paymentMode === 'card' && (k.type === 'Kredi Kartı' || k.type.includes('POS'))) ||
                    (paymentMode === 'transfer' && (k.type === 'Banka' || k.type === 'Havale'))
                  ).map(k => (
                    <option key={k.id} value={k.id} className="bg-black">{k.name} ({k.currency || 'TL'})</option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[{ id: 'cash', l: 'Nakit', i: '💵' }, { id: 'card', l: 'Kredi Kartı', i: '💳' }, { id: 'transfer', l: 'Havale/EFT', i: '🏦' }, { id: 'account', l: 'VERESİYE', i: '📖' }].map(m => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMode(m.id as any)}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${paymentMode === m.id ? 'bg-white/10 border-primary text-white shadow-lg' : 'bg-black/20 border-white/5 hover:bg-white/5 text-white/50'}`}
                >
                  <span className="text-xl mb-1">{m.i}</span>
                  <span className="text-[9px] font-bold uppercase">{m.l}</span>
                </button>
              ))}
            </div>

            {paymentMode === 'card' && (
              <div className="mt-4 animate-in slide-in-from-top-2">
                <label className="text-[9px] font-bold opacity-50 block mb-2">TAKSİT SEÇENEKLERİ</label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Dynamic POS Commissions */}
                  {appSettings?.salesExpenses?.posCommissions?.length > 0 ? (
                    appSettings.salesExpenses.posCommissions.map((comm: any, idx: number) => {
                      const count = comm.installment === 'Tek Çekim' ? 1 : parseInt(comm.installment);
                      return (
                        <button
                          key={idx}
                          onClick={() => setInstallmentCount(count || 1)}
                          className={`p-2 h-14 text-[10px] rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-all ${installmentCount === (count || 1) ? 'bg-primary border-primary text-white font-bold' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                        >
                          <span className="text-[11px]">{comm.installment}</span>
                          <span className="text-[9px] opacity-60">%{comm.rate}</span>
                        </button>
                      );
                    })
                  ) : (
                    // Fallback to hardcoded if no settings found
                    [1, 2, 3, 6, 9, 12].map(i => (
                      <button key={i} onClick={() => setInstallmentCount(i)} className={`p-2 h-12 text-[10px] rounded-lg border ${installmentCount === i ? 'bg-primary border-primary' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>{i} Taksit</button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons at the Bottom */}
        <div className="pt-4 mt-4 border-t border-border-pos space-y-3 shrink-0">
          <button
            disabled={cart.length === 0}
            onClick={() => setShowSuspendModal(true)}
            className="w-full bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold text-xs py-3 rounded-lg flex justify-center items-center gap-2 hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ⌛ BEKLEMEYE AL
          </button>

          <button
            onClick={handleFinalize}
            disabled={isProcessing || cart.length === 0}
            className={`w-full py-4 rounded-xl font-black text-white shadow-lg transition-all duration-300 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 ${cart.length > 0 ? 'bg-gradient-to-r from-orange-600 to-orange-400 shadow-orange-600/20' : 'bg-white/10 border border-white/5 text-white/30'}`}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>İŞLENİYOR...</span>
              </div>
            ) : (
              'ONAYLA ➔'
            )}
          </button>
        </div>
      </div>


      {/* --- MODALS --- */}

      {/* Customer Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#0f111a] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Müşteri Seçimi</h3>
            <input autoFocus placeholder="Müşteri ara..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 mb-4 text-white" />
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              <div onClick={() => { setSelectedCustomer('Perakende Müşteri'); setIsCustomerModalOpen(false); }} className="p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 border border-white/5">
                <div className="font-bold text-primary">Perakende Müşteri</div>
              </div>
              {filteredCustomers.map(c => (
                <div key={c.id} onClick={() => { setSelectedCustomer(c.name); setIsCustomerModalOpen(false); }} className="p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 border border-white/5 flex justify-between items-center">
                  <div><div className="font-bold">{c.name}</div><div className="text-xs opacity-50">{c.email || c.phone}</div></div>
                  <div className="text-xs bg-white/10 px-2 py-1 rounded">{c.balance || 0} TL</div>
                </div>
              ))}
            </div>
            <button onClick={() => setIsCustomerModalOpen(false)} className="mt-4 w-full bg-white/10 py-3 rounded-xl font-bold hover:bg-white/20">Kapat</button>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#0f111a] border border-white/10 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Satışı Beklemeye Al</h3>
            <input autoFocus placeholder="Etiket / İsim (Örn: Masa 5)" value={suspenseLabel} onChange={e => setSuspenseLabel(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 mb-4 text-white" />
            <div className="flex gap-2">
              <button onClick={() => setShowSuspendModal(false)} className="flex-1 bg-white/10 py-3 rounded-xl font-bold">İptal</button>
              <button onClick={handleSuspend} className="flex-1 bg-amber-500 text-black py-3 rounded-xl font-bold">Beklemeye Al</button>
            </div>
          </div>
        </div>
      )}

      {/* Resumption Modal */}
      {showResumptionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#0f111a] border border-white/10 rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold mb-4">Bekleyen Satışlar</h3>
            {suspendedSales.length === 0 ? (
              <div className="text-center opacity-50 py-8">Bekleyen satış yok.</div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {suspendedSales.map(sale => (
                  <div key={sale.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-amber-500">{sale.label}</div>
                      <div className="text-xs opacity-50">{new Date(sale.timestamp).toLocaleTimeString()} - {sale.items.length} Ürün</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-lg">₺{sale.total.toLocaleString()}</div>
                      <button onClick={() => handleResume(sale)} className="bg-primary px-3 py-1 rounded text-xs font-bold ml-2">SEÇ</button>
                      <button onClick={() => removeSuspendedSale(sale.id)} className="bg-red-500/20 text-red-500 px-3 py-1 rounded text-xs font-bold">SİL</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowResumptionModal(false)} className="mt-4 w-full bg-white/10 py-3 rounded-xl font-bold">Kapat</button>
          </div>
        </div>
      )}

    </div>
  );
}

export default function POSPage() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="h-screen flex items-center justify-center bg-[var(--bg-deep)] text-white text-2xl">⏳</div>;
  if (!isAuthenticated) return <LoginPageContent />;
  return <Suspense fallback={<div>Yükleniyor...</div>}><POSContent /></Suspense>;
}
