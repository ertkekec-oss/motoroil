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
        bottom: '15px',
        left: '255px',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        padding: '8px',
        borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.1)',
        cursor: 'pointer',
        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
      }}
      onClick={() => setIsActive(!isActive)}
    >
      <div style={{ fontSize: '16px' }}>🎤</div>
      {isActive && (
        <div style={{
          position: 'absolute',
          top: '-3px',
          right: '-3px',
          width: '10px',
          height: '10px',
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
  const { products, kasalar, processSale, customers, transactions } = useApp();
  const { showSuccess, showError, showWarning } = useModal();

  // --- POS STATES ---
  const [cart, setCart] = useState<any[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('Perakende Müşteri');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'card' | 'transfer' | 'account' | null>(null);
  const [installmentCount, setInstallmentCount] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedKasa, setSelectedKasa] = useState<string | number>('');
  const [posSettings, setPosSettings] = useState<any>({ posCommissions: [] });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('motoroil_settings_expenses');
      if (saved) {
        try { setPosSettings(JSON.parse(saved)); } catch (e) { }
      }
    }
  }, []);

  // Discount States
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [discountValue, setDiscountValue] = useState(0);

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

    const totalCash = (kasalar || [])
      .filter(k => k.type === 'Nakit')
      .reduce((sum, k) => sum + Number(k.balance || 0), 0);

    const ecommerceSales = (transactions || [])
      .filter(t => t.description?.includes('E-ticaret') && new Date(t.date) >= today)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const criticalStockCount = (products || []).filter(p => Number(p.stock) <= Number(p.minStock || 5)).length;

    return {
      revenue: dailyRevenue,
      expense: dailyExpense,
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
  const discountAmount = discountType === 'percent' ? (subtotal * discountValue / 100) : discountValue;
  const finalTotal = Math.max(0, subtotal - discountAmount);

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
        paymentMode: paymentMode,
        customerName: selectedCustomer,
        description: `POS Satışı${discountAmount > 0 ? ` (İndirim: ₺${discountAmount.toFixed(2)})` : ''}`,
        installments: installmentCount > 1 ? installmentCount : undefined,
        kasaId: selectedKasa || ''
      });

      if (success) {
        showSuccess("Başarılı", "Satış tamamlandı.");
        setCart([]);
        setPaymentMode(null);
        setInstallmentCount(1);
        setDiscountValue(0);
        setSelectedKasa('');
      }
    } catch (err: any) {
      showError("Hata", err.message || "İşlem hatası.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      padding: '12px',
      color: 'white',
      width: '100%',
      minHeight: '100%',
      display: 'flex',
      gap: '12px'
    }}>

      {/* SOL PANEL (Stats Grid + Search + Cart) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>

        {/* 6'LI İSTATİSTİK GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {/* Row 1 */}
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '10px' }}>
            <div style={{ fontSize: '9px', fontWeight: '900', color: '#ff4d4d', letterSpacing: '0.5px' }}>KRİTİK STOK</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '2px' }}>{stats.criticalStock} Ürün</div>
          </div>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '12px', borderRadius: '10px' }}>
            <div style={{ fontSize: '9px', fontWeight: '900', color: '#3b82f6', letterSpacing: '0.5px' }}>E-TİCARET GÜNLÜK</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '2px' }}>{stats.ecommerce.toLocaleString('tr-TR')} ₺</div>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '10px' }}>
            <div style={{ fontSize: '9px', fontWeight: '900', color: '#10b981', letterSpacing: '0.5px' }}>ŞUBE SATIŞ</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '2px' }}>{stats.revenue.toLocaleString('tr-TR')} ₺</div>
          </div>

          {/* Row 2 */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px', borderRadius: '10px' }}>
            <div style={{ fontSize: '9px', fontWeight: '900', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.5px' }}>GÜNLÜK CİRO</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '2px' }}>₺ {stats.revenue.toLocaleString('tr-TR')}</div>
          </div>
          <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '10px' }}>
            <div style={{ fontSize: '9px', fontWeight: '900', color: '#ff4d4d', letterSpacing: '0.5px' }}>GÜNLÜK GİDER</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '2px', color: '#ff4d4d' }}>₺ {stats.expense.toLocaleString('tr-TR')}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px', borderRadius: '10px' }}>
            <div style={{ fontSize: '9px', fontWeight: '900', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.5px' }}>GÜNLÜK KASA (NAKİT)</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '2px' }}>₺ {stats.cash.toLocaleString('tr-TR')}</div>
          </div>
        </div>

        {/* Arama Barı */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', flexShrink: 0 }}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Ürün adı, kod veya barkod..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', padding: '10px 15px', color: 'white', fontSize: '15px', outline: 'none' }}
          />
          <button type="submit" style={{ background: '#FF5500', color: 'white', border: 'none', padding: '0 20px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>EKLE</button>

          {filteredProducts.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#121421', borderRadius: '10px', marginTop: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', zIndex: 1000, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              {filteredProducts.map(p => (
                <div key={p.id} onClick={() => addToCart(p)} style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="search-row-pos-mini">
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{p.name}</div>
                    <div style={{ fontSize: '10px', opacity: 0.5 }}>{p.barcode}</div>
                  </div>
                  <div style={{ fontWeight: '900', color: '#FF5500', fontSize: '15px' }}>₺{Number(p.price).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </form>

        {/* Sepet Listesi */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '5px' }}>
          {cart.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.05 }}>
              <div style={{ fontSize: '70px' }}>📦</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '12px' }}>İşlem Bekliyor</div>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 2 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{item.name}</div>
                  <div style={{ fontSize: '10px', opacity: 0.4 }}>{item.barcode}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'center' }}>
                  <button onClick={() => setCart(cart.map((c, i) => i === idx ? { ...c, qty: Math.max(1, c.qty - 1) } : c))} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '24px', height: '24px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>-</button>
                  <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center', fontSize: '14px' }}>{item.qty}</span>
                  <button onClick={() => setCart(cart.map((c, i) => i === idx ? { ...c, qty: c.qty + 1 } : c))} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '24px', height: '24px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>+</button>
                </div>
                <div style={{ flex: 1, textAlign: 'right', fontWeight: '900', color: '#FF5500', fontSize: '15px' }}>
                  ₺{(item.price * item.qty).toLocaleString()}
                </div>
                <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#ff4d4d', marginLeft: '12px', cursor: 'pointer', fontSize: '20px' }}>×</button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SAĞ PANEL (Maintenance + Summary) */}
      <div style={{ width: '420px', display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>

        {/* BAKIM UYARILARI */}
        <div style={{ background: 'rgba(245, 158, 11, 0.12)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', minHeight: '52px' }}>
          <span style={{ fontSize: '16px' }}>🛠️</span>
          <marquee scrollamount="3" style={{ width: '100%' }}>Yaklaşan Araç Bakımları: [34ABC123] 50km kaldı • [06XYZ99] Bakım günü bugün • [35MOT45] 1 gün kaldı</marquee>
        </div>

        {/* SATIŞ ÖZETİ */}
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)', flexShrink: 0 }}>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '900', letterSpacing: '1px', opacity: 0.5 }}>SATIŞ ÖZETİ</h2>
          </div>

          <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px', flex: 1, minHeight: 0 }}>

            {/* Müşteri Bilgisi */}
            <div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 'bold', marginBottom: '6px' }}>MÜŞTERİ SEÇİMİ</div>
              <div onClick={() => setIsCustomerModalOpen(true)} style={{ background: '#121218', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: '800', fontSize: '14px' }}>👤 {selectedCustomer}</div>
                <div style={{ fontSize: '10px', color: '#FF5500', fontWeight: 'BOLD' }}>DEĞİŞTİR ▾</div>
              </div>
            </div>

            {/* İndirim Alanı */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'rgba(255,255,255,0.3)' }}>İNDİRİM</span>
                <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '2px', borderRadius: '5px' }}>
                  <button onClick={() => setDiscountType('percent')} style={{ padding: '2px 10px', fontSize: '10px', background: discountType === 'percent' ? '#FF5500' : 'transparent', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>%</button>
                  <button onClick={() => setDiscountType('amount')} style={{ padding: '2px 10px', fontSize: '10px', background: discountType === 'amount' ? '#FF5500' : 'transparent', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>₺</button>
                </div>
              </div>
              <input
                type="number"
                value={discountValue || ''}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                style={{ width: '100%', background: '#121218', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', color: 'white', fontSize: '18px', textAlign: 'right', fontWeight: '900', outline: 'none' }}
                placeholder="0"
              />
            </div>

            {/* Toplamlar */}
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', opacity: 0.5 }}>
                <span>Ara Toplam</span>
                <span style={{ fontWeight: 'bold' }}>{subtotal.toLocaleString('tr-TR')} ₺</span>
              </div>
              <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '900', letterSpacing: '1px' }}>ÖDENECEK</span>
                  <span style={{ fontSize: '32px', fontWeight: '950', color: '#FF5500' }}>{finalTotal.toLocaleString('tr-TR')} ₺</span>
                </div>
              </div>
            </div>

            <div style={{ flex: 1 }}></div>

            {/* Ödeme Yöntemleri */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>ÖDEME YÖNTEMİ</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                {[
                  { id: 'cash', label: 'NAKİT', icon: '💵' },
                  { id: 'card', label: 'KART', icon: '💳' },
                  { id: 'transfer', label: 'HAVALE', icon: '🏦' },
                  { id: 'account', label: 'VERESİYE', icon: '📖' }
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setPaymentMode(m.id as any);
                      // Auto-select first viable option
                      if (m.id === 'cash') setSelectedKasa(kasalar.find(k => k.type === 'Nakit')?.id || '');
                      if (m.id === 'transfer') setSelectedKasa(kasalar.find(k => k.type === 'Banka')?.id || '');
                      if (m.id === 'card') setSelectedKasa(kasalar.find(k => k.type === 'Kredi Kartı' || k.type === 'Banka')?.id || '');
                    }}
                    style={{
                      padding: '12px 8px',
                      background: paymentMode === m.id ? (m.id === 'account' ? '#F50057' : '#FF5500') : 'rgba(255,255,255,0.03)',
                      borderRadius: '8px', border: paymentMode === m.id ? '1px solid white' : '1px solid rgba(255,255,255,0.05)',
                      cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', transition: '0.2s'
                    }}
                  >
                    <span style={{ fontSize: '22px' }}>{m.icon}</span>
                    <span style={{ color: 'white', fontSize: '10px', fontWeight: 'bold', opacity: paymentMode === m.id ? 1 : 0.5 }}>{m.label}</span>
                  </button>
                ))}
              </div>

              {/* DYNAMIC EXTRA FIELDS */}
              {paymentMode === 'cash' && (
                <div className="animate-fade-in" style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '4px' }}>Kasa Seçimi</label>
                  <select
                    value={selectedKasa}
                    onChange={e => setSelectedKasa(e.target.value)}
                    style={{ width: '100%', padding: '10px', background: '#121218', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '13px' }}
                  >
                    <option value="">Seçiniz...</option>
                    {kasalar.filter(k => k.type === 'Nakit').map(k => (
                      <option key={k.id} value={k.id}>{k.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {paymentMode === 'transfer' && (
                <div className="animate-fade-in" style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '4px' }}>Banka Hesabı Seçimi</label>
                  <select
                    value={selectedKasa}
                    onChange={e => setSelectedKasa(e.target.value)}
                    style={{ width: '100%', padding: '10px', background: '#121218', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '13px' }}
                  >
                    <option value="">Seçiniz...</option>
                    {kasalar.filter(k => k.type === 'Banka').map(k => (
                      <option key={k.id} value={k.id}>{k.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {paymentMode === 'card' && (
                <div className="animate-fade-in" style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '4px' }}>Taksit Seçenekleri</label>
                    <select
                      onChange={e => {
                        const val = e.target.value; // "Tek Çekim", "3 Taksit", etc.
                        // Parse number
                        const num = parseInt(val);
                        setInstallmentCount(isNaN(num) ? 1 : num);
                      }}
                      style={{ width: '100%', padding: '10px', background: '#121218', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '13px' }}
                    >
                      {posSettings.posCommissions.map((comm: any, idx: number) => (
                        <option key={idx} value={comm.installment}>{comm.installment} - %{comm.rate}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <button
              disabled={isProcessing || !paymentMode || cart.length === 0}
              onClick={handleFinalize}
              style={{
                width: '100%', padding: '18px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #FF5500 0%, #FF2200 100%)',
                color: 'white', fontSize: '18px', fontWeight: '900', border: 'none',
                cursor: 'pointer', boxShadow: '0 8px 16px rgba(255, 61, 0, 0.2)',
                opacity: (isProcessing || !paymentMode || cart.length === 0) ? 0.4 : 1,
                flexShrink: 0
              }}
            >
              {isProcessing ? 'İŞLENİYOR...' : 'ONAYLA ➔'}
            </button>
          </div>
        </div>
      </div>

      <SalesMonitorIndicator />

      {/* MÜŞTERİ SEÇİM MODAL */}
      {isCustomerModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsCustomerModalOpen(false)}>
          <div style={{ background: '#0a0a12', width: '500px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)', padding: '30px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>MÜŞTERİ LİSTESİ</h2>
              <button onClick={() => setIsCustomerModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '28px', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ maxHeight: '450px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                onClick={() => { setSelectedCustomer('Perakende Müşteri'); setIsCustomerModalOpen(false); inputRef.current?.focus(); }}
                style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid #FF5500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px' }}
              >
                <span style={{ fontSize: '24px' }}>🏪</span>
                <div style={{ fontWeight: '900', fontSize: '16px' }}>Perakende Müşteri (Genel)</div>
              </div>
              {customers.filter(c => c.name !== 'Perakende Müşteri').map((c, i) => (
                <div key={i} onClick={() => { setSelectedCustomer(c.name); setIsCustomerModalOpen(false); inputRef.current?.focus(); }} style={{ padding: '15px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="customer-row-pos-mini">
                  <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{c.name}</div>
                  <div style={{ color: Number(c.balance) > 0 ? '#ff4d4d' : '#00e676', fontWeight: 'bold', fontSize: '15px' }}>₺{Math.abs(Number(c.balance || 0)).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
                .search-row-pos-mini:hover { background: rgba(255, 85, 0, 0.1) !important; }
                .customer-row-pos-mini:hover { background: rgba(255,255,255,0.05) !important; border-color: #FF5500 !important; }
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
