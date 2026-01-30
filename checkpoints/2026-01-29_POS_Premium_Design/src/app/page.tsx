"use client";

import { useState, useEffect, useMemo, Suspense, useCallback, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';
import { useSearchParams } from 'next/navigation';

// --- SALES MONITOR COMPONENT ---
function SalesMonitorIndicator() {
  const [isActive, setIsActive] = useState(false);
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '160px',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        padding: '10px',
        borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.1)',
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
      }}
      onClick={() => setIsActive(!isActive)}
    >
      <div style={{ fontSize: '20px' }}>🎤</div>
      {isActive && (
        <div style={{
          position: 'absolute',
          top: '-5px',
          right: '-5px',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: '#ef4444',
          border: '2px solid #000',
          animation: 'pulse 1.5s infinite'
        }}></div>
      )}
      <style jsx>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
    </div>
  );
}

function POSContent() {
  const searchParams = useSearchParams();
  const { products, kasalar, processSale, customers, transactions, notifications } = useApp();
  const { showSuccess, showError, showWarning } = useModal();

  // --- POS STATES ---
  const [cart, setCart] = useState<any[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('Perakende Müşteri');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'card' | 'transfer' | 'account' | null>(null);
  const [installmentCount, setInstallmentCount] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Discount States
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [discountValue, setDiscountValue] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (searchParams) {
      const cust = searchParams.get('selectedCustomer');
      if (cust) setSelectedCustomer(cust);
    }
  }, [searchParams]);

  // --- DASHBOARD STATS ---
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyRevenue = (transactions || [])
      .filter(t => (t.type === 'Sales' || t.type === 'SalesInvoice') && new Date(t.date) >= today)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalCash = (kasalar || [])
      .filter(k => k.type === 'Nakit')
      .reduce((sum, k) => sum + Number(k.balance || 0), 0);

    const ecommerceSales = (transactions || [])
      .filter(t => t.description?.includes('E-ticaret') && new Date(t.date) >= today)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const criticalStockCount = (products || []).filter(p => Number(p.stock) <= Number(p.minStock || 5)).length;

    return {
      revenue: dailyRevenue,
      cash: totalCash,
      ecommerce: ecommerceSales,
      criticalStock: criticalStockCount
    };
  }, [transactions, kasalar, products]);

  // --- PRODUCT SEARCH & BARCODE LOGIC ---
  const filteredProducts = useMemo(() => {
    if (!searchInput || searchInput.length < 2) return [];
    const lowerSearch = searchInput.toLowerCase();
    return (products || []).filter(p =>
      (p.name || '').toLowerCase().includes(lowerSearch) ||
      (p.barcode || '').includes(lowerSearch) ||
      (p.code || '').toLowerCase().includes(lowerSearch)
    ).slice(0, 8);
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
  const discountAmount = discountType === 'percent' ? (subtotal * discountValue / 100) : discountValue;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleFinalize = async () => {
    if (cart.length === 0) return;
    if (!paymentMode) return showWarning("Hata", "Lütfen bir ödeme yöntemi seçiniz.");

    setIsProcessing(true);
    try {
      const success = await processSale({
        items: cart.map(i => ({ productId: i.id, qty: i.qty })),
        total: finalTotal,
        paymentMode: paymentMode,
        customerName: selectedCustomer,
        description: `POS Satışı (İndirim: ₺${discountAmount.toFixed(2)})`,
        installments: installmentCount > 1 ? installmentCount : undefined
      });

      if (success) {
        showSuccess("Başarılı", "Satış başarıyla tamamlandı.");
        setCart([]);
        setPaymentMode(null);
        setInstallmentCount(1);
        setDiscountValue(0);
      }
    } catch (err: any) {
      showError("Hata", err.message || "İşlem sırasında bir hata oluştu.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: '20px', color: 'white', maxWidth: '100vw', minHeight: '100vh', background: '#020205', display: 'flex', gap: '20px' }}>

      {/* SOL TARAF: ANA PANEL */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ÜST STATS VE ALERT ALANI */}
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          {/* Küçük Vibrant Kutular */}
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', minWidth: '180px' }}>
            <div style={{ fontSize: '24px' }}>📉</div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: '900', color: '#ff4d4d' }}>KRİTİK STOK</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{stats.criticalStock} Ürün</div>
            </div>
          </div>

          <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', minWidth: '180px' }}>
            <div style={{ fontSize: '24px' }}>🛒</div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: '900', color: '#3b82f6' }}>E-TİCARET GÜNLÜK</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{stats.ecommerce.toLocaleString('tr-TR')} ₺</div>
            </div>
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', minWidth: '180px' }}>
            <div style={{ fontSize: '24px' }}>🏪</div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: '900', color: '#10b981' }}>ŞUBE SATIŞ GÜNLÜK</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{stats.revenue.toLocaleString('tr-TR')} ₺</div>
            </div>
          </div>

          {/* Alert Bannerları */}
          <div style={{ flex: 1, display: 'flex', gap: '10px', overflowX: 'auto' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '12px 20px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
              ⚠️ Kritik Stok: {stats.criticalStock} Ürün yenilenmeli
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '12px 20px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.3)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
              🛠️ Bakıma kalan araçlar listelendi
            </div>
          </div>
        </div>

        {/* ORTA BÜYÜK STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', padding: '25px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>GÜNLÜK CİRO</div>
            <div style={{ fontSize: '32px', fontWeight: '900', marginTop: '10px' }}>₺ {stats.revenue.toLocaleString('tr-TR')}</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', padding: '25px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>GÜNLÜK KASA (NAKİT)</div>
            <div style={{ fontSize: '32px', fontWeight: '900', marginTop: '10px' }}>₺ {stats.cash.toLocaleString('tr-TR')}</div>
          </div>
        </div>

        {/* ARAMA BÖLÜMÜ */}
        <div style={{ position: 'relative' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Ürün adı, kod veya barkod..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{ width: '100%', background: 'transparent', border: 'none', padding: '15px 20px', color: 'white', fontSize: '18px', outline: 'none' }}
              />
              {filteredProducts.length > 0 && (
                <div style={{ position: 'absolute', top: 'calc(100% + 15px)', left: 0, right: 0, background: '#121421', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', zIndex: 1000, boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
                  {filteredProducts.map(p => (
                    <div key={p.id} onClick={() => addToCart(p)} style={{ padding: '15px 20px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="search-row-pos">
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                        <div style={{ fontSize: '11px', opacity: 0.5 }}>{p.barcode}</div>
                      </div>
                      <div style={{ fontWeight: '900', color: '#FF5500' }}>₺{Number(p.price).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" style={{ background: '#FF5500', color: 'white', border: 'none', padding: '0 40px', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>EKLE</button>
          </form>
        </div>

        {/* SEPET LİSTESİ */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {cart.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
              <div style={{ fontSize: '80px' }}>🏍️</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '10px' }}>İşlem Bekliyor</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {cart.map((item, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '15px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                    <div style={{ fontSize: '11px', opacity: 0.5 }}>{item.barcode}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, justifyContent: 'center' }}>
                    <button onClick={() => setCart(cart.map((c, i) => i === idx ? { ...c, qty: Math.max(1, c.qty - 1) } : c))} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer' }}>-</button>
                    <span style={{ fontWeight: 'bold', minWidth: '30px', textAlign: 'center' }}>{item.qty}</span>
                    <button onClick={() => setCart(cart.map((c, i) => i === idx ? { ...c, qty: c.qty + 1 } : c))} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer' }}>+</button>
                  </div>
                  <div style={{ flex: 1, textAlign: 'right', fontWeight: '900', color: '#FF5500' }}>
                    ₺{(item.price * item.qty).toLocaleString()}
                  </div>
                  <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#ff4d4d', marginLeft: '20px', cursor: 'pointer', fontSize: '20px' }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SAĞ TARAF: SATIŞ ÖZETİ PANELI */}
      <div style={{ width: '400px', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '30px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)' }}>SATIŞ ÖZETİ</h2>
        </div>

        <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '25px', flex: 1 }}>

          {/* Müşteri Seçimi */}
          <div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 'bold', marginBottom: '8px' }}>MÜŞTERİ SEÇİMİ</div>
            <div
              onClick={() => setIsCustomerModalOpen(true)}
              style={{ background: '#121218', padding: '15px 20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div style={{ fontWeight: '800' }}>👤 {selectedCustomer}</div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#FF5500' }}>DEĞİŞTİR ▾</div>
            </div>
          </div>

          {/* İndirim Yöntemi */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 'bold' }}>İNDİRİM YÖNTEMİ</div>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '2px', borderRadius: '6px' }}>
                <button
                  onClick={() => setDiscountType('percent')}
                  style={{ background: discountType === 'percent' ? '#FF5500' : 'transparent', border: 'none', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                >%</button>
                <button
                  onClick={() => setDiscountType('amount')}
                  style={{ background: discountType === 'amount' ? '#FF5500' : 'transparent', border: 'none', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                >₺</button>
              </div>
            </div>
            <input
              type="number"
              value={discountValue || ''}
              onChange={(e) => setDiscountValue(Number(e.target.value))}
              placeholder="0"
              style={{ width: '100%', background: '#121218', border: '1px solid rgba(255,255,255,0.05)', padding: '15px 20px', borderRadius: '10px', color: 'white', fontSize: '18px', textAlign: 'right', fontWeight: 'bold', outline: 'none' }}
            />
          </div>

          {/* Fiyat Detayları */}
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.5)' }}>
              <span style={{ fontWeight: '500' }}>Ara Toplam</span>
              <span style={{ fontWeight: 'bold' }}>{subtotal.toLocaleString('tr-TR')} ₺</span>
            </div>
            <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: '900', letterSpacing: '1px' }}>ÖDENECEK</span>
                <span style={{ fontSize: '36px', fontWeight: '950', color: '#FF5500' }}>{finalTotal.toLocaleString('tr-TR')} ₺</span>
              </div>
            </div>
          </div>

          {/* Ödeme Yöntemleri Grid */}
          <div style={{ marginTop: 'auto' }}>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 'bold', marginBottom: '12px', textAlign: 'center' }}>ÖDEME YÖNTEMİ</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { id: 'cash', label: 'NAKİT', icon: '💵' },
                { id: 'card', label: 'KART', icon: '💳' },
                { id: 'transfer', label: 'HAVALE', icon: '🏦' }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMode(m.id as any)}
                  style={{
                    padding: '20px 10px', background: paymentMode === m.id ? '#FF5500' : 'rgba(255,255,255,0.03)',
                    borderRadius: '10px', border: paymentMode === m.id ? '2px solid white' : '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: '0.2s'
                  }}
                >
                  <span style={{ fontSize: '24px' }}>{m.icon}</span>
                  <span style={{ color: paymentMode === m.id ? 'white' : 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 'bold' }}>{m.label}</span>
                </button>
              ))}
              <button
                onClick={() => setPaymentMode('account')}
                style={{
                  padding: '20px 10px', background: paymentMode === 'account' ? '#F50057' : 'rgba(255,255,255,0.03)',
                  borderRadius: '10px', border: paymentMode === 'account' ? '2px solid white' : '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
                }}
              >
                <span style={{ fontSize: '24px' }}>📖</span>
                <span style={{ color: paymentMode === 'account' ? 'white' : 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 'bold' }}>VERESİYE</span>
              </button>
            </div>
          </div>

          <button
            disabled={isProcessing || !paymentMode || cart.length === 0}
            onClick={handleFinalize}
            style={{
              width: '100%', padding: '20px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #FF5500 0%, #FF2200 100%)',
              color: 'white', fontSize: '18px', fontWeight: '900', border: 'none',
              cursor: 'pointer', boxShadow: '0 10px 30px rgba(255, 61, 0, 0.3)',
              opacity: (isProcessing || !paymentMode || cart.length === 0) ? 0.4 : 1
            }}
          >
            {isProcessing ? 'İŞLENİYOR...' : 'ONAYLA ➔'}
          </button>
        </div>
      </div>

      <SalesMonitorIndicator />

      {/* --- MÜŞTERİ MODAL --- */}
      {isCustomerModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsCustomerModalOpen(false)}>
          <div style={{ background: '#0a0a12', width: '600px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', padding: '40px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900' }}>MÜŞTERİ SEÇİN</h2>
              <button onClick={() => setIsCustomerModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '32px', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ maxHeight: '500px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                onClick={() => { setSelectedCustomer('Perakende Müşteri'); setIsCustomerModalOpen(false); inputRef.current?.focus(); }}
                style={{ padding: '25px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid #FF5500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px' }}
              >
                <div style={{ fontSize: '24px' }}>🏪</div>
                <div style={{ fontWeight: '900' }}>Perakende Müşteri (Genel)</div>
              </div>
              {customers.filter(c => c.name !== 'Perakende Müşteri').map((c, i) => (
                <div key={i} onClick={() => { setSelectedCustomer(c.name); setIsCustomerModalOpen(false); inputRef.current?.focus(); }} style={{ padding: '25px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="customer-row-pos">
                  <div style={{ fontWeight: 'bold' }}>{c.name}</div>
                  <div style={{ color: Number(c.balance) > 0 ? '#ff4d4d' : '#00e676', fontWeight: 'bold' }}>₺{Math.abs(Number(c.balance || 0)).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
                .search-row-pos:hover { background: rgba(255, 85, 0, 0.1) !important; }
                .customer-row-pos:hover { background: rgba(255,255,255,0.05) !important; border-color: #FF5500 !important; }
            `}</style>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', color: 'white', textAlign: 'center' }}>Sistem Yükleniyor...</div>}>
      <POSContent />
    </Suspense>
  );
}
