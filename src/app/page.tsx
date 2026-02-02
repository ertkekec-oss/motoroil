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


function POSContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { activeBranchName } = useApp();
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

    const criticalStockCount = (products || []).filter(p => Number(p.stock) <= Number(p.minStock || 5)).length;
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

  // Calculate VAT Excluded Total
  const vatExcludedTotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const lineTotal = Number(item.price || 0) * item.qty;
      // Assume price is Tax Included (default retail behavior) unless flagged otherwise
      // Use item.salesVat (e.g. 20)
      const vatRate = typeof item.salesVat === 'number' ? item.salesVat : 20; // Default 20% if missing
      const isVatIncluded = item.salesVatIncluded !== false; // Default true

      let basePrice = 0;
      if (isVatIncluded) {
        basePrice = lineTotal / (1 + (vatRate / 100));
      } else {
        // If VAT not included, then price is already base. 
        // BUT subtotal considers item.price as the gross unit usually in this app logic (from previous context). 
        // If item.price implies +VAT, then subtotal logic needs update or we assume item.price IS the final visible price.
        // Let's assume item.price is always what the customer sees on the shelf (Gross).
        // So we just strip VAT from it.
        basePrice = lineTotal / (1 + (vatRate / 100));
      }
      return sum + basePrice;
    }, 0);
  }, [cart]);

  const finalTotal = Math.max(0, subtotal - totalDiscount);

  const customer = useMemo(() => {
    return customers.find(c => c.name === selectedCustomer);
  }, [selectedCustomer, customers]);

  // Auto-select Kasa when paymentMode or activeBranchName changes
  useEffect(() => {
    if (!paymentMode || paymentMode === 'account') {
      setSelectedKasa('');
      return;
    }

    const filtered = (kasalar || []).filter(k => {
      // Branch filter
      const branchMatch = !k.branch || k.branch === 'Global' || k.branch === activeBranchName;
      if (!branchMatch) return false;

      // Type filter mapping
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
        // success is false, but an error message might have been shown by AppContext or we should show a generic one
        showError("Hata", "Satış kaydedilemedi. Lütfen kasalarınızı ve bağlantınızı kontrol edin.");
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
      showConfirm("Mevcut Sepet Ne Olsun?", "Aktif bir sepetiniz var. Askıdaki sepeti geri çağırmak mevcut sepeti silecek.", () => {
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
    showSuccess('Geri Yüklendi', 'Askıya alınan sepet başarıyla geri yüklendi.');
  };

  const handleApplyReference = () => {
    if (!referenceCode) return;

    const referrer = customers.find(c => c.referralCode?.toUpperCase() === referenceCode.toUpperCase());

    if (referrer) {
      showSuccess("Referans Geçerli", `${referrer.name} referansı ile indirim uygulandı!`);
      // Apply the referee gift discount if it exists in settings
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
        showError('Hata', 'Bu kuponun kullanım limiti dolmuş.');
        return;
      }

      const now = new Date();
      if (coupon.startDate && new Date(coupon.startDate) > now) {
        showError('Hata', 'Kupon henüz aktif değil.');
        return;
      }
      if (coupon.expiryDate && new Date(coupon.expiryDate) < now) {
        showError('Hata', 'Kuponun süresi dolmuş.');
        return;
      }

      if (coupon.minPurchaseAmount && subtotal < Number(coupon.minPurchaseAmount)) {
        showError('Hata', `Bu kupon için minimum harcama tutarı: ₺${coupon.minPurchaseAmount}`);
        return;
      }

      if (coupon.conditions) {
        const { brands, categories } = coupon.conditions as any;
        const hasValidItem = cart.some(item => {
          const brandMatch = !brands || brands.length === 0 || brands.includes(item.brand);
          const catMatch = !categories || categories.length === 0 || categories.includes(item.category);
          return brandMatch && catMatch;
        });

        if (!hasValidItem && (brands?.length > 0 || categories?.length > 0)) {
          showError('Hata', 'Kupon sepetinizdeki ürünler için geçerli değil.');
          return;
        }
      }

      setValidCoupon(coupon);
      showSuccess('Başarılı', 'Kupon başarıyla uygulandı!');

    } catch (e) {
      showError('Hata', 'Kupon doğrulanırken hata oluştu.');
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

        {/* ÜST DASHBOARD - 4 KART */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">


          {/* GÜNLÜK CİRO */}
          <div className="stat-card-modern" style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.08))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '18px',
            borderRadius: '16px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(16, 185, 129, 0.1)'
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '70px', opacity: 0.08, pointerEvents: 'none', zIndex: 0 }}>💰</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', position: 'relative', zIndex: 10 }}>
              <div style={{ fontSize: '10px', fontWeight: '800', color: '#6ee7b7', letterSpacing: '1px' }}>GÜNLÜK CİRO</div>
              <button
                onClick={() => setHideRevenue(!hideRevenue)}
                className="privacy-btn"
                style={{
                  background: hideRevenue ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  cursor: 'pointer'
                }}
              >{hideRevenue ? '👁️' : '🙈'}</button>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#10b981', textShadow: '0 2px 10px rgba(16, 185, 129, 0.3)' }}>
              {hideRevenue ? '₺*****' : `₺${stats.revenue.toLocaleString()}`}
            </div>
          </div>

          {/* GÜNLÜK KAR */}
          <div className="stat-card-modern" style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.08))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            padding: '18px',
            borderRadius: '16px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.1)'
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '70px', opacity: 0.08, pointerEvents: 'none', zIndex: 0 }}>📈</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', position: 'relative', zIndex: 10 }}>
              <div style={{ fontSize: '10px', fontWeight: '800', color: '#93c5fd', letterSpacing: '1px' }}>GÜNLÜK KAR</div>
              <button
                onClick={() => setHideProfit(!hideProfit)}
                className="privacy-btn"
                style={{
                  background: hideProfit ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  cursor: 'pointer'
                }}
              >{hideProfit ? '👁️' : '🙈'}</button>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: stats.profit >= 0 ? '#3b82f6' : '#ef4444', textShadow: '0 2px 10px rgba(59, 130, 246, 0.3)' }}>
              {hideProfit ? '₺*****' : `₺${stats.profit.toLocaleString()}`}
            </div>
          </div>

          {/* GÜNLÜK GİDER */}
          <div className="stat-card-modern" style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.08))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '18px',
            borderRadius: '16px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(239, 68, 68, 0.1)'
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '70px', opacity: 0.08, pointerEvents: 'none', zIndex: 0 }}>💸</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', position: 'relative', zIndex: 10 }}>
              <div style={{ fontSize: '10px', fontWeight: '800', color: '#fca5a5', letterSpacing: '1px' }}>GÜNLÜK GİDER</div>
              <button
                onClick={() => setHideExpense(!hideExpense)}
                className="privacy-btn"
                style={{
                  background: hideExpense ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  cursor: 'pointer'
                }}
              >{hideExpense ? '👁️' : '🙈'}</button>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#ef4444', textShadow: '0 2px 10px rgba(239, 68, 68, 0.3)' }}>
              {hideExpense ? '₺*****' : `₺${stats.expense.toLocaleString()}`}
            </div>
          </div>

          {/* BİLDİRİMLER */}
          <div
            onClick={() => router.push('/notifications')}
            className="stat-card-modern"
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.08))',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              padding: '18px',
              borderRadius: '16px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(245, 158, 11, 0.1)',
              cursor: 'pointer'
            }}
          >
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '70px', opacity: 0.08 }}>🔔</div>
            <div style={{ fontSize: '10px', fontWeight: '800', color: '#fcd34d', letterSpacing: '1px', marginBottom: '10px' }}>BİLDİRİMLER</div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#f59e0b', textShadow: '0 2px 10px rgba(245, 158, 11, 0.3)' }}>
              {stats.criticalStock + stats.inTransit}
            </div>
            {(stats.criticalStock + stats.inTransit) > 0 && (
              <div className="pulse-dot" style={{ position: 'absolute', top: '12px', right: '12px', background: '#f59e0b', width: '10px', height: '10px', borderRadius: '50%' }}></div>
            )}
          </div>
        </div>

        {/* ANA GÖVDE: SEPET + KARTLAR (ARAMA BARI SEPETİN ÜSTÜNDE) */}
        <div className="flex flex-mobile-col" style={{ flex: 1, gap: '16px', minHeight: 0 }}>


          {/* SOL KOLON: ARAMA + SEPET */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
            {/* ARAMA BARI */}
            <form onSubmit={handleSearchSubmit} style={{
              display: 'flex',
              gap: '8px',
              background: 'rgba(255,255,255,0.02)',
              padding: '6px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.06)',
              position: 'relative'
            }}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Barkod, ürün adı veya kod..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button type="submit" className="btn-primary" style={{ padding: '0 24px', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}>EKLE</button>

              {filteredProducts.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', borderRadius: '12px', marginTop: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', zIndex: 1000, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                  {filteredProducts.map(p => (
                    <div key={p.id} onClick={() => addToCart(p)} className="search-result-row" style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '13px' }}>{p.name}</div>
                        <div style={{ fontSize: '10px', opacity: 0.4, marginTop: '2px' }}>{p.barcode}</div>
                      </div>
                      <div style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '14px' }}>₺{Number(p.price).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </form>

            {/* SEPET LISTESI */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {cart.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}>
                  <div style={{ fontSize: '60px' }}>🛒</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', marginTop: '12px' }}>Sepet Boş</div>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="cart-item" style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 2, minWidth: 0 }}>
                      <div style={{ fontWeight: '600', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                      <div style={{ fontSize: '10px', opacity: 0.3, marginTop: '2px' }}>{item.barcode}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button onClick={() => setCart(cart.map((c, i) => i === idx ? { ...c, qty: Math.max(1, c.qty - 1) } : c))} className="qty-btn">-</button>
                      <span style={{ fontWeight: '700', minWidth: '24px', textAlign: 'center', fontSize: '13px' }}>{item.qty}</span>
                      <button onClick={() => setCart(cart.map((c, i) => i === idx ? { ...c, qty: c.qty + 1 } : c))} className="qty-btn">+</button>
                    </div>
                    <div style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '14px', minWidth: '80px', textAlign: 'right' }}>₺{(item.price * item.qty).toLocaleString()}</div>
                    <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px' }}>×</button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SAĞ DİKEY KART GURUBU (ARTIK BOŞLUKSUZ) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '200px' }}>
            {/* BEKLEYEN */}
            <div onClick={() => suspendedSales.length > 0 && setShowResumptionModal(true)} className="stat-card-modern stat-card-compact" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.08))', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '14px', borderRadius: '12px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-15px', right: '-15px', fontSize: '50px', opacity: 0.1 }}>⏳</div>
              <div style={{ fontSize: '9px', fontWeight: '800', color: '#fcd34d', marginBottom: '6px' }}>BEKLEYEN</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#f59e0b' }}>{suspendedSales.length}</div>
            </div>

            {/* KRİTİK */}
            <div onClick={() => router.push('/inventory?filter=critical-stock')} className="stat-card-modern stat-card-compact" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.08))', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '14px', borderRadius: '12px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-15px', right: '-15px', fontSize: '50px', opacity: 0.1 }}>🚨</div>
              <div style={{ fontSize: '9px', fontWeight: '800', color: '#fca5a5', marginBottom: '6px' }}>KRİTİK STOK</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#ef4444' }}>{stats.criticalStock}</div>
            </div>

            {/* YOLDAKİ */}
            <div onClick={() => router.push('/inventory?tab=transfers')} className="stat-card-modern stat-card-compact" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.08))', border: '1px solid var(--border-subtle)', padding: '14px', borderRadius: '12px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-15px', right: '-15px', fontSize: '50px', opacity: 0.1 }}>🚚</div>
              <div style={{ fontSize: '9px', fontWeight: '800', color: '#93c5fd', marginBottom: '6px' }}>YOLDAKİ</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#3b82f6' }}>{stats.inTransit}</div>
            </div>
          </div>
        </div>
      </div>

      {/* SAĞ PANEL (SATIŞ ÖZETİ) */}
      <div className="flex-col" style={{ width: '100%', maxWidth: '400px', gap: '16px', alignSelf: 'flex-start' }}>

        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <h2 style={{ margin: 0, fontSize: '14px', fontWeight: '800', opacity: 0.5 }}>SATIŞ ÖZETİ</h2>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto' }}>
            {/* Müşteri */}
            <div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '700', marginBottom: '8px' }}>MÜŞTERİ</div>
              <div onClick={() => setIsCustomerModalOpen(true)} className="customer-select" style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><div style={{ fontWeight: '700', fontSize: '13px' }}>{selectedCustomer}</div></div>
                <div style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: '700' }}>DEĞİŞTİR ▾</div>
              </div>
            </div>
            {/* Referans Kodu */}
            {/* Kod Uygula Butonu */}
            <button
              onClick={() => setShowPromotionsModal(true)}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--secondary), #2563eb)',
                border: 'none',
                color: 'white',
                fontWeight: '800',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.2)',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '18px' }}>🎁</span> KOD VEYA REFERANS UYGULA
            </button>
            {/* İndirim */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '9px', opacity: 0.4, fontWeight: '700', display: 'block', marginBottom: '6px' }}>İNDİRİM</label>
                <div style={{ position: 'relative' }}>
                  <input type="number" value={discountValue || ''} onChange={e => setDiscountValue(Number(e.target.value))} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '10px', borderRadius: '8px', color: 'white', fontSize: '13px' }} />
                  <button onClick={() => setDiscountType(discountType === 'percent' ? 'amount' : 'percent')} style={{ position: 'absolute', right: '6px', top: '6px', bottom: '6px', background: 'var(--primary)', padding: '0 8px', border: 'none', borderRadius: '6px', color: 'white', fontSize: '10px' }}>{discountType === 'percent' ? '%' : '₺'}</button>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '9px', opacity: 0.4, fontWeight: '700', display: 'block', marginBottom: '6px' }}>PUAN</label>
                <input type="number" value={pointsToUse || ''} onChange={e => setPointsToUse(Number(e.target.value))} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '10px', borderRadius: '8px', color: 'white', fontSize: '13px' }} />
              </div>
            </div>
            {/* Toplamlar */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', opacity: 0.5 }}><span>Ara Toplam</span><span>₺{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                <span>KDV Hariç</span>
                <span>₺{vatExcludedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              {manualDiscountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#10b981' }}>
                  <span>Manuel İndirim</span>
                  <span>-₺{manualDiscountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              {couponDiscountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#10b981' }}>
                  <span>Kupon İndirimi ({validCoupon?.code})</span>
                  <span>-₺{couponDiscountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              {campaignDiscountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#10b981' }}>
                  <span>Kampanya İndirimi</span>
                  <span>-₺{campaignDiscountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              {pointsDiscountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#10b981' }}>
                  <span>Puan Kullanımı</span>
                  <span>-₺{pointsDiscountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontWeight: '800' }}>TOPLAM</span>
                <span style={{ fontSize: '28px', fontWeight: '900', color: 'var(--primary)' }}>₺{finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div style={{ flex: 1 }}></div>
            {/* Ödeme Yöntemleri */}
            <div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '700', marginBottom: '10px', textAlign: 'center' }}>ÖDEME YÖNTEMİ</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                {[
                  ...(paymentMethods || []),
                  { id: 'account', label: 'VERESİYE', icon: '📖', type: 'account' }
                ].map((m: any) => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMode(m.type)}
                    className="payment-btn"
                    style={{
                      padding: '12px',
                      background: paymentMode === m.type ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                      borderRadius: '10px',
                      border: paymentMode === m.type ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{m.icon}</span>
                    <span style={{ color: 'white', fontSize: '10px', fontWeight: '700', opacity: paymentMode === m.type ? 1 : 0.5 }}>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Kasa/Banka Seçimi (Unified) */}
            {paymentMode && paymentMode !== 'account' && (
              <div className="animate-fade-in" style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                  {paymentMode === 'cash' ? 'KASA SEÇİMİ' : (paymentMode === 'card' ? 'POS / BANKA SEÇİMİ' : 'HAVALE / BANKA SEÇİMİ')}
                </label>
                <select
                  value={selectedKasa}
                  onChange={e => setSelectedKasa(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                >
                  <option value="">Seçiniz...</option>
                  {(kasalar || []).filter(k => {
                    const branchMatch = !k.branch || k.branch === 'Global' || k.branch === activeBranchName;
                    if (!branchMatch) return false;

                    if (paymentMode === 'cash') return k.type === 'Nakit';
                    if (paymentMode === 'card') return k.type === 'Kredi Kartı' || k.type.includes('POS');
                    if (paymentMode === 'transfer') return k.type === 'Banka' || k.type === 'Havale';
                    return false;
                  }).map(k => (
                    <option key={k.id} value={k.id}>{k.name}</option>
                  ))}
                </select>
              </div>
            )}

            {paymentMode === 'card' && (
              <div className="animate-fade-in" style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>TAKSİT</label>
                  <select
                    onChange={e => {
                      const val = e.target.value;
                      setInstallmentLabel(val);
                      const num = parseInt(val);
                      setInstallmentCount(isNaN(num) ? 1 : num);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    <option value="">Tek Çekim</option>
                    {(salesExpenses?.posCommissions || []).map((comm: any, idx: number) => (
                      <option key={idx} value={comm.installment}>{comm.installment}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            {suspendedSales.length > 0 && (
              <button
                onClick={() => setShowResumptionModal(true)}
                className="animate-pulse"
                style={{
                  width: '100%',
                  marginBottom: '8px',
                  padding: '10px',
                  borderRadius: '10px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  color: '#60a5fa',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                📂 BEKLEYEN SATIŞLAR ({suspendedSales.length})
              </button>
            )}

            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <button
                disabled={cart.length === 0}
                onClick={() => setShowSuspendModal(true)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(234, 179, 8, 0.1)',
                  border: '1px solid rgba(234, 179, 8, 0.3)',
                  color: '#fbbf24',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: cart.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                ⏳ BEKLEMEYE AL
              </button>
              <button
                disabled={cart.length === 0}
                onClick={() => {
                  // Using browser confirm is fine here for quick action
                  if (window.confirm('Sepeti temizlemek istediğinize emin misiniz?')) setCart([]);
                }}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                  width: '48px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                🗑️
              </button>
            </div>

            <button disabled={isProcessing || !paymentMode || cart.length === 0} onClick={handleFinalize} className="btn-primary" style={{ width: '100%', padding: '16px', borderRadius: '12px', fontSize: '15px', fontWeight: '800' }}>{isProcessing ? 'İŞLENİYOR...' : 'ONAYLA ➔'}</button>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {isCustomerModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsCustomerModalOpen(false)}>
          <div style={{ background: 'var(--bg-card)', width: '800px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>MÜŞTERİ SEÇİMİ</h3>
              <button onClick={() => setIsCustomerModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>

            {/* Add New Customer Toggle/Form */}
            {!isAddingCustomer ? (
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="🔍 Müşteri ara..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  autoFocus
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                />
                <button
                  onClick={() => setIsAddingCustomer(true)}
                  className="btn-primary"
                  style={{ padding: '0 16px', borderRadius: '8px', fontSize: '12px', whiteSpace: 'nowrap' }}
                >
                  + YENİ EKLE
                </button>
              </div>
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontWeight: '700', fontSize: '12px', color: 'var(--primary)', marginBottom: '4px' }}>YENİ MÜŞTERİ OLUŞTUR</div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Ad Soyad / Firma Adı *"
                    value={newCustomerData.name}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                    style={{ padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '13px' }}
                  />
                  <input
                    type="text"
                    placeholder="Yetkili Kişi"
                    value={newCustomerData.contactPerson}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, contactPerson: e.target.value })}
                    style={{ padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '13px' }}
                  />
                  <input
                    type="text"
                    placeholder="Telefon"
                    value={newCustomerData.phone}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                    style={{ padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="E-posta"
                    value={newCustomerData.email}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                    style={{ padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '13px' }}
                  />
                  <input
                    type="text"
                    placeholder="Vergi No"
                    value={newCustomerData.taxNumber}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, taxNumber: e.target.value })}
                    style={{ padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '13px' }}
                  />
                  <input
                    type="text"
                    placeholder="Vergi Dairesi"
                    value={newCustomerData.taxOffice}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, taxOffice: e.target.value })}
                    style={{ padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="IBAN (TR...)"
                    value={newCustomerData.iban}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, iban: e.target.value })}
                    style={{ padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '13px' }}
                  />
                  <select
                    value={newCustomerData.customerClass}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, customerClass: e.target.value })}
                    style={{ padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '13px' }}
                  >
                    <option value="">Sınıf Seç...</option>
                    {(custClasses || []).map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Ref. Kodu"
                    value={newCustomerData.referredByCode}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, referredByCode: e.target.value.toUpperCase() })}
                    style={{ padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '13px' }}
                  />
                </div>

                <textarea
                  placeholder="Adres"
                  value={newCustomerData.address}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, address: e.target.value })}
                  style={{ padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', minHeight: '40px', resize: 'vertical', fontSize: '13px' }}
                />

                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button onClick={handleSaveNewCustomer} className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '6px', fontSize: '13px' }}>KAYDET & SEÇ</button>
                  <button onClick={() => setIsAddingCustomer(false)} style={{ padding: '10px 20px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer' }}>İPTAL</button>
                </div>
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '300px' }}>
              {/* Always Show Perakende Default */}
              <div
                onClick={() => { setSelectedCustomer('Perakende Müşteri'); setIsCustomerModalOpen(false); }}
                style={{
                  padding: '14px',
                  cursor: 'pointer',
                  background: selectedCustomer === 'Perakende Müşteri' ? 'var(--primary-20)' : 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--primary)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{ background: 'var(--primary)', padding: '8px', borderRadius: '50%', fontSize: '16px' }}>🏬</div>
                <div style={{ fontWeight: '700' }}>Perakende Müşteri</div>
              </div>

              {filteredCustomerList.map((c, i) => (
                <div key={i} onClick={() => { setSelectedCustomer(c.name); setIsCustomerModalOpen(false); }} className="customer-row" style={{ padding: '12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>{c.name}</div>
                    <div style={{ fontSize: '11px', opacity: 0.5 }}>{c.phone || c.email || 'İletişim yok'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', color: (c.points || 0) > 0 ? '#fbbf24' : 'rgba(255,255,255,0.3)' }}>
                      {c.points ? `✨ ${c.points} P` : ''}
                    </div>
                    {c.balance !== 0 && (
                      <div style={{ fontSize: '11px', color: c.balance > 0 ? '#ef4444' : '#10b981' }}>
                        {c.balance > 0 ? `Borç: ₺${c.balance}` : `Alacak: ₺${Math.abs(c.balance)}`}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {filteredCustomerList.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', opacity: 0.4, fontSize: '13px' }}>
                  Kayıt bulunamadı. Yeni ekleyebilirsiniz.
                </div>
              )}
            </div>

            <style jsx>{`
                .customer-row:hover { background: rgba(255,255,255,0.05); border-radius: 8px; }
            `}</style>
          </div>
        </div>
      )}

      {showResumptionModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }} onClick={() => setShowResumptionModal(false)}>
          <div style={{ background: 'var(--bg-card)', width: '600px', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-light)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>⏳ ASKIDAKİ SEPETLER</h3>
              <button
                onClick={() => setShowResumptionModal(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%' }}
              >✕</button>
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {suspendedSales.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>Askıda satış bulunmuyor.</div>
              ) : suspendedSales.map(s => (
                <div key={s.id} style={{
                  background: 'rgba(255,255,255,0.03)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                  className="hover:bg-white/5"
                >
                  <div onClick={() => handleResumeSale(s.id)} style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>{s.label}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'flex', gap: '12px' }}>
                      <span>👤 {s.customer?.name || 'Müşteri Yok'}</span>
                      <span>📦 {s.items.length} Ürün</span>
                      <span>🕒 {new Date(s.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontWeight: '800', fontSize: '16px', color: 'var(--primary)' }}>₺{Number(s.total).toLocaleString()}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <button
                        onClick={() => handleResumeSale(s.id)}
                        className="btn-primary"
                        style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '6px' }}
                      >SEÇ</button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          showConfirm('Sil?', 'Bu askıdaki satışı silmek istediğinize emin misiniz?', () => removeSuspendedSale(s.id));
                        }}
                        style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: 'none', cursor: 'pointer' }}
                      >SİL</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
              Toplam {suspendedSales.length} bekleyen işlem
            </div>
          </div>
        </div>
      )}

      {showPromotionsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 3500, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }} onClick={() => setShowPromotionsModal(false)}>
          <div style={{ background: 'var(--bg-card)', width: '450px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '900', margin: 0, color: 'var(--primary)' }}>🎁 KOD UYGULA</h2>
              <button
                onClick={() => setShowPromotionsModal(false)}
                style={{ background: 'rgba(120,120,120,0.1)', border: 'none', color: 'white', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', fontWeight: '900' }}
              >✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Referans Kodu */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <label style={{ fontSize: '11px', opacity: 0.5, fontWeight: '800', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>REFERANS KODU</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Müşteri referans kodu..."
                    value={referenceCode}
                    onChange={(e) => setReferenceCode(e.target.value)}
                    style={{ flex: 1, background: 'var(--bg-deep)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none' }}
                  />
                  <button
                    onClick={() => { handleApplyReference(); }}
                    className="btn btn-primary"
                    style={{ padding: '0 20px', borderRadius: '10px', fontWeight: '800', fontSize: '12px' }}
                  >UYGULA</button>
                </div>
              </div>

              {/* Kupon Kodu */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <label style={{ fontSize: '11px', opacity: 0.5, fontWeight: '800', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>İNDİRİM KUPONU</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Kupon kodunuz..."
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    style={{ flex: 1, background: 'var(--bg-deep)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none' }}
                  />
                  <button
                    onClick={() => { handleValidateCoupon(); }}
                    className="btn-primary"
                    style={{ padding: '0 20px', borderRadius: '10px', fontWeight: '800', fontSize: '12px', background: 'var(--success)', borderColor: 'var(--success)' }}
                  >UYGULA</button>
                </div>
              </div>

              <button
                onClick={() => setShowPromotionsModal(false)}
                className="btn btn-ghost"
                style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}
              >PENCEREYİ KAPAT</button>
            </div>
          </div>
        </div>
      )}

      {showSuspendModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }} onClick={() => setShowSuspendModal(false)}>
          <div style={{ background: 'var(--bg-card)', width: '400px', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-light)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '800' }}>⏳ SATIŞI BEKLEMEYE AL</h3>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>Bu satış işlemini daha sonra tamamlamak üzere geçici olarak kaydedin.</p>

            <input
              type="text"
              placeholder="Hatırlatıcı Not (Örn: 34 ABC 123, Ahmet Bey...)"
              value={suspenseLabel}
              onChange={(e) => setSuspenseLabel(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '16px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white'
              }}
            />

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleSuspendSale}
                disabled={!suspenseLabel}
                className="btn-primary"
                style={{ flex: 1, padding: '12px', borderRadius: '8px', opacity: !suspenseLabel ? 0.5 : 1 }}
              >
                KAYDET & PARK ET
              </button>
              <button
                onClick={() => setShowSuspendModal(false)}
                style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer' }}
              >
                İPTAL
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', color: 'white', textAlign: 'center' }}>Yükleniyor...</div>}>
      <POSContent />
    </Suspense>
  );
}
