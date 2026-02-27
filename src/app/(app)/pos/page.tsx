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
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, Legend
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useUpsell } from '@/hooks/useUpsell';
import CashflowForecastChart from '@/components/CashflowForecastChart';
import AnomalyAlert from '@/components/AnomalyAlert';

export default function PosTerminalPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentUser, activeBranchName } = useApp();
  const { products, stockTransfers } = useInventory();
  const {
    kasalar, transactions, refreshTransactions,
    paymentMethods, salesExpenses
  } = useFinancials();
  const { customers, refreshCustomers, custClasses } = useCRM();
  const {
    processSale, suspendedSales, suspendSale, removeSuspendedSale
  } = useSales();
  const {
    campaigns, referralSettings, appSettings, updateAppSetting
  } = useSettings();

  const { showSuccess, showError, showWarning, showConfirm } = useModal();

  // --- POS STATES ---
  const [cart, setCart] = useState<any[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('Perakende Müşteri');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'card' | 'transfer' | 'account' | null>(null);
  const [installmentCount, setInstallmentCount] = useState(1);
  const [installmentLabel, setInstallmentLabel] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedKasa, setSelectedKasa] = useState<string | number>('');
  const [couponCode, setCouponCode] = useState('');
  const [pointsToUse, setPointsToUse] = useState(0);
  const [validCoupon, setValidCoupon] = useState<any>(null);
  const [referenceCode, setReferenceCode] = useState('');
  const [insightsData, setInsightsData] = useState<any>(null);

  const { isAuthenticated } = useAuth();
  const { checkUpsell } = useUpsell();

  // --- FETCH INSIGHTS ---
  useEffect(() => {
    const fetchInsights = async () => {
      if (!isAuthenticated) return;
      try {
        const res = await fetch('/api/user/insights');
        const data = await res.json();
        setInsightsData(data);
      } catch (err) {
        console.error('Insights fetch error:', err);
      }
    };
    fetchInsights();
  }, [isAuthenticated]);


  // Customer Selection & Adding
  const [customerSearch, setCustomerSearch] = useState('');
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    taxNumber: '',
    taxOffice: '',
    contactPerson: '',
    iban: '',
    customerClass: '',
    referredByCode: ''
  });

  const handleSaveNewCustomer = async () => {
    if (!newCustomerData.name) {
      showError('Hata', 'Müşteri adı zorunludur.');
      return;
    }
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomerData)
      });
      const data = await res.json();
      if (data.success) {
        if (refreshCustomers) await refreshCustomers();
        setSelectedCustomer(data.customer.name);
        setIsCustomerModalOpen(false);
        setIsAddingCustomer(false);
        setNewCustomerData({ name: '', phone: '', email: '', address: '', taxNumber: '', taxOffice: '', contactPerson: '', iban: '', customerClass: '', referredByCode: '' });
        showSuccess('Başarılı', 'Yeni müşteri oluşturuldu ve seçildi.');
      } else {
        showError('Hata', data.error);
      }
    } catch (e: any) {
      showError('Hata', e.message);
    }
  };

  const filteredCustomerList = useMemo(() => {
    let list = customers || [];
    // Filter out 'Perakende Müşteri' because we will show it explicitly at top
    list = list.filter(c => c.name !== 'Perakende Müşteri');

    if (customerSearch.trim() === '') {
      return list.slice(0, 20); // Show recent 20
    }
    return list.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()));
  }, [customers, customerSearch]);

  // --- SUSPEND STATES ---
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspenseLabel, setSuspenseLabel] = useState('');
  const [showResumptionModal, setShowResumptionModal] = useState(false);
  const [showPromotionsModal, setShowPromotionsModal] = useState(false);

  // Discount States
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [discountValue, setDiscountValue] = useState(0);

  // Privacy States - Persistent
  const { hideRevenue, hideProfit, hideExpense } = appSettings.privacySettings || { hideRevenue: false, hideProfit: false, hideExpense: false };
  const setHideRevenue = (val: boolean) => updateAppSetting('privacySettings', { ...appSettings.privacySettings, hideRevenue: val });
  const setHideProfit = (val: boolean) => updateAppSetting('privacySettings', { ...appSettings.privacySettings, hideProfit: val });
  const setHideExpense = (val: boolean) => updateAppSetting('privacySettings', { ...appSettings.privacySettings, hideExpense: val });

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  // --- DASHBOARD STATS ---
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyRevenue = (transactions || [])
      .filter(t => (t.type === 'Sales' || t.type === 'SalesInvoice') && new Date(t.date) >= today)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const dailyExpense = (transactions || [])
      .filter(t => t.type === 'Expense' && new Date(t.date) >= today)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // Calculate COGS (Cost of Goods Sold) from today's sales
    let dailyCOGS = 0;
    const todaySales = (transactions || [])
      .filter(t => (t.type === 'Sales' || t.type === 'SalesInvoice') && new Date(t.date) >= today);

    // For each sale, calculate the cost based on items sold
    // This is a simplified calculation - ideally we'd track actual COGS per sale
    // For now, we'll estimate based on average margin or use a default ratio
    // Auto parts typically have 35-45% gross margin, so COGS ≈ 55-65% of revenue
    // TODO: Track actual COGS in sales records for accurate profit calculation
    dailyCOGS = dailyRevenue * 0.60; // Assuming 40% gross margin

    // Real Profit = Revenue - COGS - Operating Expenses
    const dailyProfit = dailyRevenue - dailyCOGS - dailyExpense;

    const totalCash = (kasalar || [])
      .filter(k => k.type === 'Nakit')
      .reduce((sum, k) => sum + Number(k.balance || 0), 0);

    const criticalStockCount = (products || []).filter(p => {
      const s = p.stocks?.reduce((acc: any, st: any) => acc + (st.quantity || 0), 0) ?? (p.stock || 0);
      return s <= (p.minStock || 5);
    }).length;
    const inTransitCount = (stockTransfers || []).filter(t => t.status === 'IN_TRANSIT').length;

    return {
      revenue: dailyRevenue,
      expense: dailyExpense,
      profit: dailyProfit,
      cash: totalCash,
      criticalStock: criticalStockCount,
      inTransit: inTransitCount
    };
  }, [transactions, kasalar, products, stockTransfers]);

  // --- PRODUCT SEARCH & BARCODE LOGIC ---
  const filteredProducts = useMemo(() => {
    if (!searchInput || searchInput.length < 2) return [];
    const lowerSearch = searchInput.toLowerCase();
    return (products || []).filter(p =>
      (p.name || '').toLowerCase().includes(lowerSearch) ||
      (p.barcode || '').includes(lowerSearch) ||
      (p.code || '').toLowerCase().includes(lowerSearch)
    ).slice(0, 6);
  }, [products, searchInput]);

  const addToCart = useCallback((product: any, qty: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + qty } : item);
      }
      return [...prev, { ...product, qty }];
    });
    setSearchInput('');
    inputRef.current?.focus();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput) return;
    const product = products.find(p => p.barcode === searchInput || p.code === searchInput);
    if (product) {
      addToCart(product, 1);
    } else if (filteredProducts.length === 1) {
      addToCart(filteredProducts[0], 1);
    } else {
      showWarning("Bulunamadı", "Bu ürün kaydı bulunamadı.");
      setSearchInput('');
    }
  };

  // --- CALCULATIONS ---
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price || 0) * item.qty), 0);
  const manualDiscountAmount = discountType === 'percent' ? (subtotal * discountValue / 100) : discountValue;
  const couponDiscountAmount = validCoupon ? (validCoupon.type === 'amount' ? validCoupon.value : (subtotal * (validCoupon.value / 100))) : 0;
  const pointsDiscountAmount = pointsToUse;

  const campaignDiscountAmount = useMemo(() => {
    if (!paymentMode) return 0;
    const cmap: any = { 'cash': 'cash', 'card': 'card_single', 'transfer': 'transfer' };
    const targetMode = cmap[paymentMode];

    const activeCampaigns = (campaigns || []).filter(c =>
      c.isActive &&
      c.type === 'payment_method_discount' &&
      c.conditions.paymentMethod === targetMode
    );

    if (activeCampaigns.length === 0) return 0;

    let totalDiscount = 0;
    activeCampaigns.forEach(camp => {
      const rate = camp.discountRate || 0;
      if (rate <= 0) return;

      const condBrands = camp.conditions.brands || [];
      const condCats = camp.conditions.categories || [];

      if (condBrands.length === 0 && condCats.length === 0) {
        totalDiscount += (subtotal * rate);
      } else {
        cart.forEach(item => {
          const itemBrandMatch = condBrands.length === 0 || condBrands.includes(item.brand);
          const itemCatMatch = condCats.length === 0 || condCats.includes(item.category);
          if (itemBrandMatch && itemCatMatch) {
            totalDiscount += (Number(item.price) * item.qty * rate);
          }
        });
      }
    });

    return totalDiscount;
  }, [paymentMode, campaigns, cart, subtotal]);

  const totalDiscount = manualDiscountAmount + couponDiscountAmount + pointsDiscountAmount + campaignDiscountAmount;
  const effectiveDiscountRate = subtotal > 0 ? (totalDiscount / subtotal) * 100 : 0;
  const finalTotal = Math.max(0, subtotal - totalDiscount);

  const customer = useMemo(() => {
    return customers.find(c => c.name === selectedCustomer);
  }, [selectedCustomer, customers]);

  // Auto-select Kasa
  useEffect(() => {
    if (!paymentMode || paymentMode === 'account') {
      setSelectedKasa('');
      return;
    }
    const filtered = (kasalar || []).filter(k => {
      const branchMatch = !k.branch || k.branch === 'Global' || k.branch === activeBranchName;
      if (!branchMatch) return false;
      if (paymentMode === 'cash') return k.type === 'Nakit';
      if (paymentMode === 'card') return k.type === 'Kredi Kartı' || k.type.includes('POS');
      if (paymentMode === 'transfer') return k.type === 'Banka' || k.type === 'Havale';
      return false;
    });

    if (filtered.length === 1) {
      setSelectedKasa(filtered[0].id);
    } else if (selectedKasa && !filtered.find(f => String(f.id) === String(selectedKasa))) {
      setSelectedKasa('');
    }
  }, [paymentMode, kasalar, activeBranchName]);

  const handleFinalize = async () => {
    if (cart.length === 0) return;
    if (!paymentMode) return showWarning("Hata", "Lütfen bir ödeme yöntemi seçiniz.");

    if (paymentMode !== 'account' && !selectedKasa) {
      return showWarning("Hata", `Lütfen işlem yapılacak ${paymentMode === 'cash' ? 'kasayı' : (paymentMode === 'card' ? 'POS hesabını' : 'bankayı')} seçiniz.`);
    }

    const canContinue = await checkUpsell('INVOICE_PAGE');
    if (!canContinue) return;

    if (paymentMode === 'account' && selectedCustomer === 'Perakende Müşteri') {
      return showWarning("Hata", "Perakende müşterisine veresiye satış yapılamaz. Lütfen cari seçiniz.");
    }

    setIsProcessing(true);
    try {
      const success = await processSale({
        items: cart.map(i => ({ productId: i.id, qty: i.qty })),
        total: finalTotal,
        discountAmount: manualDiscountAmount + couponDiscountAmount + campaignDiscountAmount,
        paymentMode: paymentMode,
        customerName: selectedCustomer,
        description: `POS Satışı: ${selectedCustomer} (${paymentMode})`,
        installments: installmentCount > 1 ? installmentCount : undefined,
        installmentLabel: installmentLabel,
        kasaId: selectedKasa || 'CashKasa',
        customerId: customer?.id,
        pointsUsed: pointsToUse,
        couponCode: validCoupon?.code,
        referenceCode: referenceCode
      });

      if (success) {
        showSuccess("Başarılı", "Satış tamamlandı.");
        setCart([]);
        setPaymentMode(null);
        setInstallmentCount(1);
        setDiscountValue(0);
        setSelectedKasa('');
        setPointsToUse(0);
        setValidCoupon(null);
        setCouponCode('');
        setReferenceCode('');
      } else {
        showError("Hata", "Satış kaydedilemedi.");
      }
    } catch (err: any) {
      showError("Hata", err.message || "İşlem hatası.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuspendSale = () => {
    if (cart.length === 0) return;
    suspendSale(suspenseLabel, cart.map(item => ({ product: item, qty: item.qty })), customer || null, finalTotal);
    setCart([]);
    setSelectedCustomer('Perakende Müşteri');
    setPaymentMode(null);
    setDiscountValue(0);
    setPointsToUse(0);
    setSuspenseLabel('');
    setShowSuspendModal(false);
    showSuccess('Başarılı', 'Satış askıya alındı.');
  };

  const handleResumeSale = (id: string) => {
    const sale = suspendedSales.find(s => s.id === id);
    if (!sale) return;

    if (cart.length > 0) {
      showConfirm("Mevcut Sepet Ne Olsun?", "Askıdaki sepeti geri çağırmak mevcut sepeti silecek.", () => {
        applyResumption(sale);
      });
    } else {
      applyResumption(sale);
    }
  };

  const applyResumption = (sale: any) => {
    setCart(sale.items.map((i: any) => ({ ...i.product, qty: i.qty })));
    setSelectedCustomer(sale.customer?.name || 'Perakende Müşteri');
    removeSuspendedSale(sale.id);
    setShowResumptionModal(false);
    showSuccess('Geri Yüklendi', 'Sepet geri yüklendi.');
  };

  const handleApplyReference = () => {
    if (!referenceCode) return;
    const referrer = customers.find(c => c.referralCode?.toUpperCase() === referenceCode.toUpperCase());
    if (referrer) {
      showSuccess("Referans Geçerli", `${referrer.name} referansı ile indirim uygulandı!`);
      if (referralSettings?.refereeGift > 0) {
        setDiscountType('amount');
        setDiscountValue(referralSettings.refereeGift);
      }
    } else {
      showError("Hata", "Geçersiz referans kodu.");
    }
  };

  const handleValidateCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await fetch(`/api/coupons?code=${couponCode}`);
      const coupon = await res.json();
      if (!coupon || coupon.error) {
        showError('Hata', 'Geçersiz kupon kodu.');
        return;
      }
      if (coupon.isUsed || (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit)) {
        showError('Hata', 'Kupon limiti dolmuş.');
        return;
      }
      const now = new Date();
      if ((coupon.startDate && new Date(coupon.startDate) > now) || (coupon.expiryDate && new Date(coupon.expiryDate) < now)) {
        showError('Hata', 'Kupon süresi geçersiz.');
        return;
      }
      if (coupon.minPurchaseAmount && subtotal < Number(coupon.minPurchaseAmount)) {
        showError('Hata', `Minimum sepet tutarı: ₺${coupon.minPurchaseAmount}`);
        return;
      }
      setValidCoupon(coupon);
      showSuccess('Başarılı', 'Kupon uygulandı!');
    } catch (e) {
      showError('Hata', 'Kupon hatası.');
    }
  };

  return (
    <div className="flex flex-mobile-col" style={{
      padding: '16px',
      color: 'white',
      width: '100%',
      minHeight: '100vh',
      gap: '16px',
      background: 'var(--bg-main)'
    }}>
      {/* SOL PANEL (Satış ve Liste) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>

        {/* SECURITY ALERTS */}
        <AnomalyAlert />

        {/* INSIGHTS SECTION */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>
                Hoş geldin, <span style={{ color: 'var(--primary)' }}>{currentUser?.name?.split(' ')[0] || 'Kullanıcı'}</span> 👋
              </h2>
              <p style={{ fontSize: '13px', opacity: 0.5, margin: '4px 0 0 0' }}>Sistemdeki genel durumun ve sana özel ipuçları aşağıda.</p>
            </div>
          </div>
          {insightsData?.insights?.length > 0 && (
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
              {insightsData.insights.map((insight: any, idx: number) => (
                <div key={idx} onClick={() => insight.href && router.push(insight.href)} style={{ minWidth: '300px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '16px', cursor: insight.href ? 'pointer' : 'default', transition: '0.3s', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '24px' }}>
                    {insight.type === 'growth' ? '🚀' : insight.type === 'onboarding' ? '📋' : insight.type === 'predictive' ? '🔮' : '💡'}
                  </div>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '14px', marginBottom: '2px' }}>{insight.title}</div>
                    <div style={{ fontSize: '12px', opacity: 0.6 }}>{insight.message}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DASHBOARD STATS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* RECHARTS SECTION for Weekly Trend */}
          <div className="lg:col-span-6 bg-card-modern" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '20px', minHeight: '180px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: '900', color: 'rgba(255,255,255,0.7)' }}>HAFTALIK TREND</h3>
              <span style={{ fontSize: '9px', background: 'var(--primary-dark)', padding: '2px 8px', borderRadius: '4px' }}>7 GÜN</span>
            </div>
            {insightsData?.stats?.weeklyTrend && insightsData.stats.weeklyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={insightsData.stats.weeklyTrend}>
                  <defs>
                    <linearGradient id="colorTrendPos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    hide={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                    dy={10}
                  />
                  <YAxis hide domain={[0, 'auto']} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-dark)', border: '1px solid var(--border-light)', borderRadius: '10px' }}
                    itemStyle={{ color: 'var(--primary)' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={3} fill="url(#colorTrendPos)" animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div style={{ opacity: 0.3, textAlign: 'center', fontSize: '12px', padding: '40px 0', border: '1px dashed var(--border-light)', borderRadius: '12px' }}>Trend verisi analiz ediliyor...</div>}
          </div>

          {/* CATEGORY ANALYSIS */}
          <div className="lg:col-span-3 bg-card-modern" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '20px', minHeight: '180px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '900', color: 'rgba(255,255,255,0.7)', marginBottom: '12px' }}>KATEGORİ</h3>
            {insightsData?.stats?.categoryAnalysis && insightsData.stats.categoryAnalysis.length > 0 ? (
              <ResponsiveContainer width="100%" height={100}>
                <PieChart>
                  <Pie data={insightsData.stats.categoryAnalysis} innerRadius={35} outerRadius={48} dataKey="value" stroke="none" animationDuration={1000}>
                    {insightsData.stats.categoryAnalysis.map((_: any, idx: number) => (
                      <Cell key={`cell-${idx}`} fill={['#FF5500', '#00F0FF', '#10B981', '#FACC15'][idx % 4]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-dark)', border: '1px solid var(--border-light)', borderRadius: '10px', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : <div style={{ opacity: 0.3, textAlign: 'center', fontSize: '12px', padding: '30px 0', border: '1px dashed var(--border-light)', borderRadius: '12px' }}>Analiz ediliyor...</div>}
          </div>

          {/* NOTIFICATIONS CARD */}
          <div onClick={() => router.push('/notifications')} className="lg:col-span-3 stat-card-modern" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.08))', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '20px', borderRadius: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '180px' }}>
            <div style={{ fontSize: '10px', fontWeight: '800', color: '#fcd34d' }}>BİLDİRİMLER</div>
            <div style={{ fontSize: '36px', fontWeight: '900', color: '#f59e0b' }}>{stats.criticalStock + stats.inTransit}</div>
            <div style={{ fontSize: '11px', opacity: 0.6 }}>Kritik & Bekleyen</div>
          </div>
        </div>

        {/* FORECAST CARDS */}
        {insightsData?.stats?.forecast && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ marginBottom: '8px' }}>
            <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #1e293b)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '20px', padding: '18px' }}>
              <div style={{ fontSize: '10px', fontWeight: '900', color: '#818cf8' }}>GELECEK HAFTA</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: 'white' }}>₺{insightsData.stats.forecast.nextWeekRevenue.toLocaleString()}</div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #064e3b, #065f46)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '20px', padding: '18px' }}>
              <div style={{ fontSize: '10px', fontWeight: '900', color: '#6ee7b7' }}>BÜYÜME HIZI</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: 'white' }}>%{insightsData.stats.docGrowth}</div>
            </div>
          </div>
        )}

        {/* AI CASHFLOW FORECAST (NEW) */}
        <div className="mb-4">
          <CashflowForecastChart />
        </div>

        {/* POS MAIN AREA */}
        <div className="flex flex-mobile-col" style={{ flex: 1, gap: '16px', minHeight: 0 }}>
          {/* SEARCH & CART */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '6px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <input ref={inputRef} type="text" placeholder="Barkod..." value={searchInput} onChange={e => setSearchInput(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', padding: '8px', color: 'white', outline: 'none' }} />
              <button type="submit" style={{ padding: '0 24px', borderRadius: '8px', fontWeight: '700', background: 'var(--primary)', border: 'none', color: 'white' }}>EKLE</button>
              {filteredProducts.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', zIndex: 1000, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', borderRadius: '12px' }}>
                  {filteredProducts.map(p => (
                    <div key={p.id} onClick={() => addToCart(p)} style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                      {p.name} - ₺{Number(p.price).toLocaleString()}
                    </div>
                  ))}
                </div>
              )}
            </form>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {cart.length === 0 ? <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5 }}>Sepet Boş</div> : (
                cart.map((item, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>{item.name} <div style={{ fontSize: '10px', opacity: 0.5 }}>{item.barcode}</div></div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button onClick={() => setCart(cart.map((c, i) => i === idx ? { ...c, qty: Math.max(1, c.qty - 1) } : c))}>-</button>
                      <span>{item.qty}</span>
                      <button onClick={() => setCart(cart.map((c, i) => i === idx ? { ...c, qty: c.qty + 1 } : c))}>+</button>
                      <div style={{ width: '80px', textAlign: 'right' }}>₺{(item.price * item.qty).toLocaleString()}</div>
                      <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} style={{ color: 'red' }}>×</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
