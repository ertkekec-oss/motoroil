"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { fieldDb } from '@/lib/field-db';
import { useModal } from "@/contexts/ModalContext";

export default function MobileCreateOrderPage() {
    const { showSuccess, showError, showWarning } = useModal();
    const router = useRouter();
    const searchParams = useSearchParams();
    const visitId = searchParams.get('visitId');
    const customerId = searchParams.get('customerId');
    const customerName = searchParams.get('customerName');

    const [customer, setCustomer] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<{ productId: string, name: string, price: number, qty: number }[]>([]);
    const [showCart, setShowCart] = useState(false);
    const [saving, setSaving] = useState(false);

    // Fetch customer to get their price list
    useEffect(() => {
        if (customerId) {
            fieldDb.customers.get(customerId).then(setCustomer);
        }
    }, [customerId]);

    // Live query for products
    const products = useLiveQuery(
        () => fieldDb.products
            .where('name').startsWithIgnoreCase(searchTerm)
            .limit(20)
            .toArray(),
        [searchTerm]
    );

    const getPriceForProduct = (product: any) => {
        if (customer?.priceListId && product.prices) {
            const specificPrice = product.prices.find((p: any) => p.priceListId === customer.priceListId);
            if (specificPrice) return specificPrice.price;
        }
        return product.price;
    };

    const addToCart = (product: any) => {
        const productPrice = getPriceForProduct(product);
        setCart(prev => {
            const existing = prev.find(p => p.productId === product.id);
            if (existing) {
                return prev.map(p => p.productId === product.id ? { ...p, qty: p.qty + 1 } : p);
            }
            return [...prev, { productId: product.id, name: product.name, price: productPrice, qty: 1 }];
        });
    };

    const updateQty = (productId: string, delta: number) => {
        setCart(prev => prev.map(p => {
            if (p.productId === productId) {
                const newQty = Math.max(0, p.qty + delta);
                return { ...p, qty: newQty };
            }
            return p;
        }).filter(p => p.qty > 0));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const [orderSuccess, setOrderSuccess] = useState<{ isOpen: boolean; orderId?: string; total?: number }>({ isOpen: false });

    const handleSaveOrder = async () => {
        if (!visitId || !customerId) {
            showError("Uyarı", 'Ziyaret bilgisi eksik. Lütfen tekrar deneyin.');
            return;
        }
        if (cart.length === 0) {
            showSuccess("Bilgi", 'Sepet boş.');
            return;
        }

        setSaving(true);
        try {
            // Save to Dexie (Offline First)
            await fieldDb.orders.add({
                visitId,
                customerId,
                items: cart,
                total: cartTotal,
                timestamp: Date.now(),
                synced: false
            });

            // Try to sync immediately if online
            if (navigator.onLine) {
                try {
                    const res = await fetch('/api/field-sales/orders/create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            visitId,
                            customerId,
                            items: cart,
                            total: cartTotal
                        })
                    });

                    const data = await res.json();
                    if (res.ok && data.success) {
                        // Mark as synced locally
                        setOrderSuccess({ isOpen: true, orderId: data.orderId, total: cartTotal });
                        setSaving(false);
                        return; // DO NOT navigate back, show success screen
                    }
                } catch (e) {
                    console.error('Online sync failed, saved offline', e);
                }
            }

            // Fallback for offline or sync failure
            showSuccess("Bilgi", 'Sipariş çevrimdışı kaydedildi.');
            router.back();
        } catch (e) {
            console.error(e);
            showError("Uyarı", 'Kaydetme başarısız.');
        } finally {
            setSaving(false);
        }
    };

    const handleFormalizeInvoice = async () => {
        if (!orderSuccess.orderId) return;
        setSaving(true);
        try {
            // Create draft invoice and formalize it via backend
            const res = await fetch('/api/sales/invoices/convert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: orderSuccess.orderId,
                    customerId: customerId,
                    items: cart.map(i => ({...i, vat: 20})), // Basic vat mapping for MVP
                    discount: { type: 'percent', value: 0 },
                    isFormal: true,
                    status: 'Onaylandı'
                })
            });
            const data = await res.json();
            if (data.success) {
                // Now send to GIB
                const formalRes = await fetch('/api/sales/invoices', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'formal-send', invoiceId: data.invoice.id })
                });
                const formalData = await formalRes.json();
                if (formalData.success) {
                    showSuccess('Başarılı', 'Resmi e-Fatura/e-Arşiv oluşturuldu ve GİB\'e iletildi.');
                    router.back();
                } else {
                    showError('Hata', 'Fatura taslağı oluştu ancak GİB\'e gönderilemedi: ' + formalData.error);
                }
            } else {
                showError('Hata', data.error || 'Fatura oluşturulamadı.');
            }
        } catch (e) {
            console.error(e);
            showError('Hata', 'Bağlantı sorunu yaşandı.');
        } finally {
            setSaving(false);
        }
    };

    if (!visitId) return <div className="p-8 text-white">Hata: Ziyaret ID eksik.</div>;

    return (
        <div className="flex flex-col min-h-full bg-[#0f111a] text-white pb-6 mt-safe-top">
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-[#161b22] flex justify-between items-center sticky top-0 z-40 shadow-md">
                <button onClick={() => router.back()} className="text-gray-400">İptal</button>
                <h1 className="font-bold text-sm truncate px-2">{customerName || 'Müşteri'}</h1>
                <button
                    onClick={() => setShowCart(true)}
                    className="relative bg-blue-600 px-3 py-1.5 rounded-lg text-xs font-black tracking-widest flex items-center gap-1 shadow-lg shadow-blue-500/20"
                >
                    SEPET ({cart.reduce((a, b) => a + b.qty, 0)})
                </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-white/5 sticky top-[53px] z-30 bg-[#0f111a]/95 backdrop-blur-md">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Ürün ara..."
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-white focus:border-blue-500 focus:outline-none"
                />
            </div>

            {/* Product List */}
            <div className="flex-1 p-4 space-y-3 pb-32 relative">
                {products?.map(product => {
                    const cartItem = cart.find(c => c.productId === product.id);
                    const qtyInCart = cartItem ? cartItem.qty : 0;
                    
                    return (
                        <div key={product.id} className={`bg-[#161b22] border transition-all p-4 rounded-xl flex justify-between items-center ${qtyInCart > 0 ? 'border-blue-500/50 shadow-lg shadow-blue-500/10' : 'border-white/5'}`}>
                            <div className="flex-1 pr-4">
                                <div className="font-bold text-sm leading-tight text-slate-100">{product.name}</div>
                                <div className="text-[10px] uppercase font-bold text-gray-500 mt-1">{product.category}</div>
                                <div className="font-black text-blue-400 mt-1.5 text-sm flex items-center gap-2">
                                    ₺{getPriceForProduct(product).toLocaleString()}
                                    {customer?.priceListId && product.prices?.some((p: any) => p.priceListId === customer.priceListId) && (
                                        <span className="text-[8px] bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-400 uppercase font-black">Spesifik Liste</span>
                                    )}
                                </div>
                            </div>

                            {qtyInCart > 0 ? (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="flex items-center gap-2 bg-blue-500/10 rounded-lg p-1 border border-blue-500/30">
                                        <button onClick={() => updateQty(product.id, -1)} className="w-8 h-8 rounded-md bg-blue-500/20 text-blue-400 font-bold hover:bg-blue-500/40">-</button>
                                        <span className="font-black text-base w-6 text-center text-blue-400">{qtyInCart}</span>
                                        <button onClick={() => updateQty(product.id, +1)} className="w-8 h-8 rounded-md bg-blue-500/20 text-blue-400 font-bold hover:bg-blue-500/40">+</button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => addToCart(product)}
                                    className="bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2.5 rounded-lg font-black text-xs uppercase tracking-widest text-slate-300"
                                >
                                    EKLE
                                </button>
                            )}
                        </div>
                    );
                })}
                {products?.length === 0 && (
                    <div className="text-center text-slate-500 py-10 text-sm font-bold">Kriterlere uygun ürün bulunamadı.</div>
                )}
            </div>

            {/* Cart Modal / Sheet */}
            {showCart && (
                <div className="fixed inset-0 bg-[#0f111a] z-[100] flex flex-col animate-in slide-in-from-bottom duration-300">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#161b22] py-5 sticky top-0 z-10 shadow-md">
                        <div className="flex flex-col">
                            <h2 className="font-black text-lg tracking-tight">Sipariş Sepeti</h2>
                            <span className="text-[10px] text-gray-500 font-bold uppercase">{cart.length} Ürün Çeşidi</span>
                        </div>
                        <button onClick={() => setShowCart(false)} className="bg-white/10 px-4 py-2 rounded-lg text-xs font-bold uppercase">Kapat</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-48">
                        {cart.length === 0 ? (
                            <div className="text-center opacity-50 py-20 font-bold">Sepetiniz boş. Ürün ekleyiniz.</div>
                        ) : (
                            cart.map(item => (
                                <div key={item.productId} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="flex-1 pr-4">
                                        <div className="font-bold text-sm leading-tight text-white mb-2">{item.name}</div>
                                        <div className="text-xs font-bold text-blue-400">₺{item.price.toLocaleString()} <span className="text-gray-500">x</span> <span className="text-white">{item.qty}</span> = ₺{(item.price * item.qty).toLocaleString()}</div>
                                    </div>
                                    <div className="flex items-center gap-1 bg-[#161b22] p-1 rounded-lg border border-white/5">
                                        <button onClick={() => updateQty(item.productId, -1)} className="w-10 h-10 bg-white/5 rounded-md font-bold text-lg hover:bg-white/10">-</button>
                                        <span className="font-black w-8 text-center">{item.qty}</span>
                                        <button onClick={() => updateQty(item.productId, +1)} className="w-10 h-10 bg-white/5 rounded-md font-bold text-lg hover:bg-white/10">+</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="fixed bottom-0 left-0 right-0 p-5 bg-[#161b22] border-t border-white/10 safe-area-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
                        <div className="flex justify-between items-end mb-4 px-1">
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Toplam Tutar</span>
                            <span className="text-3xl font-black text-emerald-400 tracking-tight">₺{cartTotal.toLocaleString()}</span>
                        </div>
                        <button
                            onClick={handleSaveOrder}
                            disabled={cart.length === 0 || saving}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
                        >
                            {saving ? 'KAYDEDİLİYOR...' : 'SİPARİŞİ ONAYLA VE GÖNDER'}
                        </button>
                    </div>
                </div>
            )}
            
            {/* Order Success Modal */}
            {orderSuccess.isOpen && (
                <div className="fixed inset-0 bg-[#0f111a]/90 backdrop-blur-md z-[200] flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-300">
                    <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-4xl mb-6 shadow-[0_0_80px_rgba(16,185,129,0.5)] border-4 border-emerald-400">✓</div>
                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Sipariş Tamamlandı!</h2>
                    <p className="text-gray-400 text-[11px] font-bold mb-10 uppercase tracking-widest max-w-xs leading-relaxed">
                        ₺{orderSuccess.total?.toLocaleString()} tutarındaki işlem carinin hesabına borç olarak işlendi. Lütfen sıradaki işlemi seçin.
                    </p>
                    
                    <div className="w-full max-w-sm flex flex-col gap-4">
                        <button 
                             onClick={handleFormalizeInvoice}
                             disabled={saving}
                             className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-5 rounded-2xl shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-sm tracking-widest uppercase relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-fuchsia-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <span className="relative z-10 flex items-center gap-3">🧾 E-FATURA KES {saving && <span className="animate-spin text-sm">↻</span>}</span>
                        </button>
                        
                        <button 
                             onClick={() => router.push(`/field-mobile/collection/create?visitId=${visitId}&customerId=${customerId}&customerName=${encodeURIComponent(customerName || '')}&orderId=${orderSuccess.orderId}&amount=${orderSuccess.total}`)}
                             disabled={saving}
                             className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-sm tracking-widest uppercase">
                            <span>💳</span> TAHSİLAT AL
                        </button>
                        
                        <button 
                             onClick={() => router.push(`/field-mobile/routes/${visitId}`)}
                             disabled={saving}
                             className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-black py-4 rounded-xl border border-white/5 shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-xs tracking-widest uppercase mt-4">
                            <span>🔙</span> SİPARİŞ OLARAK BIRAK (KAPAT)
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
