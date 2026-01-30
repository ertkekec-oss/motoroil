"use client";

import { useState, useEffect, useMemo, Suspense, useCallback, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';
import { useSearchParams, useRouter } from 'next/navigation';


function POSContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    products, kasalar, processSale, customers, transactions, salesExpenses,
    campaigns, stockTransfers, suspendedSales, suspendSale, removeSuspendedSale,
    refreshTransactions,
    paymentMethods
  } = useApp();
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

  // --- SUSPEND STATES ---
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspenseLabel, setSuspenseLabel] = useState('');
  const [showResumptionModal, setShowResumptionModal] = useState(false);

  // Discount States
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [discountValue, setDiscountValue] = useState(0);

  // Privacy States - Rakamları gizleme
  const [hideRevenue, setHideRevenue] = useState(false);
  const [hideProfit, setHideProfit] = useState(false);
  const [hideExpense, setHideExpense] = useState(false);

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
      .filter(t => (t.type === 'Expense' || t.type === 'Payment') && new Date(t.date) >= today)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // Kar hesaplama (basit: ciro - gider, gerçekte maliyet hesabı gerekir)
    const dailyProfit = dailyRevenue - dailyExpense;

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

  const finalTotal = Math.max(0, subtotal - manualDiscountAmount - couponDiscountAmount - pointsDiscountAmount - campaignDiscountAmount);

  const customer = useMemo(() => {
    return customers.find(c => c.name === selectedCustomer);
  }, [selectedCustomer, customers]);

  const handleFinalize = async () => {
    if (cart.length === 0) return;
    if (!paymentMode) return showWarning("Hata", "Lütfen bir ödeme yöntemi seçiniz.");

    if ((paymentMode === 'cash' || paymentMode === 'transfer') && !selectedKasa) {
      return showWarning("Hata", "Lütfen işlem yapılacak kasa/banka hesabını seçiniz.");
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

  return (
    <div style={{
      padding: '16px',
      color: 'white',
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      gap: '16px',
      background: 'var(--bg-main)'
    }}>

      {/* SOL PANEL (Satış ve Liste) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>

        {/* ÜST DASHBOARD - 3 KART (CIRO, KAR, GIDER) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>

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
        </div>

        {/* ARAMA BARI (ÜSTE SABİT) */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <form onSubmit={handleSearchSubmit} style={{
            flex: 1,
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
          <div style={{ width: '200px' }}></div>
        </div>

        {/* ALT GÖVDE: SEPET + KARTLAR */}
        <div style={{ flex: 1, display: 'flex', gap: '16px', minHeight: 0 }}>
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

          {/* 4'LÜ DİKEY KART GURUBU */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '200px' }}>
            {/* BİLDİRİMLER */}
            <div
              onClick={() => router.push('/notifications')}
              className="stat-card-modern stat-card-compact"
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.08))',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '14px',
                borderRadius: '12px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(245, 158, 11, 0.1)'
              }}
            >
              <div style={{ position: 'absolute', top: '-15px', right: '-15px', fontSize: '50px', opacity: 0.1 }}>🔔</div>
              <div style={{ fontSize: '9px', fontWeight: '800', color: '#fcd34d', letterSpacing: '0.5px', marginBottom: '6px' }}>BİLDİRİMLER</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#f59e0b', textShadow: '0 2px 10px rgba(245, 158, 11, 0.3)' }}>
                {stats.criticalStock + stats.inTransit}
              </div>
              {(stats.criticalStock + stats.inTransit) > 0 && (
                <div className="pulse-dot" style={{ position: 'absolute', top: '8px', right: '8px', background: '#f59e0b', width: '8px', height: '8px', borderRadius: '50%' }}></div>
              )}
            </div>

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
            <div onClick={() => router.push('/inventory?tab=transfers')} className="stat-card-modern stat-card-compact" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.08))', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '14px', borderRadius: '12px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-15px', right: '-15px', fontSize: '50px', opacity: 0.1 }}>🚚</div>
              <div style={{ fontSize: '9px', fontWeight: '800', color: '#93c5fd', marginBottom: '6px' }}>YOLDAKİ</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#3b82f6' }}>{stats.inTransit}</div>
            </div>
          </div>
        </div>
      </div>

      {/* SAĞ PANEL (SATIŞ ÖZETİ) */}
      <div style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
            <div>
              <label style={{ fontSize: '9px', opacity: 0.4, fontWeight: '700', display: 'block', marginBottom: '6px' }}>REFERANS KODU</label>
              <input type="text" placeholder="Opsiyonel..." value={referenceCode} onChange={(e) => setReferenceCode(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '10px', borderRadius: '8px', color: 'white', fontSize: '12px', fontWeight: '600' }} />
            </div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', opacity: 0.5 }}><span>Ara Toplam</span><span>₺{subtotal.toLocaleString()}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontWeight: '800' }}>TOPLAM</span><span style={{ fontSize: '28px', fontWeight: '900', color: 'var(--primary)' }}>₺{finalTotal.toLocaleString()}</span></div>
            </div>
            <div style={{ flex: 1 }}></div>
            {/* Ödeme Yöntemleri */}
            <div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '700', marginBottom: '10px', textAlign: 'center' }}>ÖDEME YÖNTEMİ</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                {[
                  ...(paymentMethods || []),
                  { id: 'account', label: 'VERESİYE', icon: '📖', type: 'account', linkedKasaId: '' }
                ].map((m: any) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setPaymentMode(m.type);
                      if (m.linkedKasaId) {
                        setSelectedKasa(m.linkedKasaId);
                      } else {
                        if (m.type === 'cash') setSelectedKasa(kasalar.find(k => !['Banka', 'POS', 'Sanal POS', 'Havale'].some(t => k.type.includes(t)))?.id || '');
                        if (m.type === 'transfer') setSelectedKasa(kasalar.find(k => k.type.includes('Banka') || k.type.includes('Havale'))?.id || '');
                        if (m.type === 'card') setSelectedKasa(kasalar.find(k => k.type.includes('POS') || k.type.includes('Kredi') || k.type.includes('Banka'))?.id || '');
                      }
                    }}
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

            {/* Kasa/Banka/Taksit Seçimi */}
            {paymentMode === 'cash' && (
              <div className="animate-fade-in" style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>KASA</label>
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
                  {kasalar?.filter(k => !['Banka', 'POS', 'Sanal POS', 'Havale'].some(t => k.type.includes(t))).map(k => (
                    <option key={k.id} value={k.id}>{k.name}</option>
                  ))}
                </select>
              </div>
            )}

            {paymentMode === 'transfer' && (
              <div className="animate-fade-in" style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>BANKA</label>
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
                  {kasalar?.filter(k => k.type.includes('Banka') || k.type.includes('Havale')).map(k => (
                    <option key={k.id} value={k.id}>{k.name}</option>
                  ))}
                </select>
              </div>
            )}

            {paymentMode === 'card' && (
              <div className="animate-fade-in" style={{ marginBottom: '12px' }}>
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
                  <option value="">Seçiniz...</option>
                  {(salesExpenses?.posCommissions || []).map((comm: any, idx: number) => (
                    <option key={idx} value={comm.installment}>{comm.installment}</option>
                  ))}
                </select>
              </div>
            )}
            <button disabled={isProcessing || !paymentMode || cart.length === 0} onClick={handleFinalize} className="btn-primary" style={{ width: '100%', padding: '16px', borderRadius: '12px', fontSize: '15px', fontWeight: '800' }}>{isProcessing ? 'İŞLENİYOR...' : 'ONAYLA ➔'}</button>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {isCustomerModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsCustomerModalOpen(false)}>
          <div style={{ background: 'var(--bg-card)', width: '500px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}><h3>MÜŞTERİ SEÇİMİ</h3><button onClick={() => setIsCustomerModalOpen(false)}>×</button></div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {customers.map((c, i) => (
                <div key={i} onClick={() => { setSelectedCustomer(c.name); setIsCustomerModalOpen(false); }} style={{ padding: '12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{c.name}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showResumptionModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-card)', width: '500px', borderRadius: '16px', padding: '24px' }}>
            <h3>ASKIDAKİ SEPETLER</h3>
            {suspendedSales.map(s => <div key={s.id} onClick={() => handleResumeSale(s.id)} style={{ padding: '12px', cursor: 'pointer' }}>{s.label} - ₺{s.total}</div>)}
            <button onClick={() => setShowResumptionModal(false)}>KAPAT</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .stat-card-modern:hover { transform: translateY(-4px); }
        .cart-item:hover { background: rgba(255,255,255,0.06) !important; }
        .qty-btn { width: 32px; height: 32px; cursor: pointer; }
      `}</style>
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
