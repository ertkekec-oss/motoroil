
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { fieldDb } from '@/lib/field-db';

export default function MobileCreateOrderPage() {
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

    const handleSaveOrder = async () => {
        if (!visitId || !customerId) {
            alert('Ziyaret bilgisi eksik. Lütfen tekrar deneyin.');
            return;
        }
        if (cart.length === 0) {
            alert('Sepet boş.');
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

                    if (res.ok) {
                        // Mark as synced locally if successful? 
                        // Or just clear? Logic: keep it but mark synced.
                        // For MVP: Navigate back.
                    }
                } catch (e) {
                    console.error('Online sync failed, saved offline', e);
                }
            }

            alert('Sipariş kaydedildi.');
            router.back();
        } catch (e) {
            console.error(e);
            alert('Kaydetme başarısız.');
        } finally {
            setSaving(false);
        }
    };

    if (!visitId) return <div className="p-8 text-white">Hata: Ziyaret ID eksik.</div>;

    return (
        <div className="flex flex-col h-screen bg-[#0f111a] text-white">
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-[#161b22] flex justify-between items-center">
                <button onClick={() => router.back()} className="text-gray-400">İptal</button>
                <h1 className="font-bold text-sm">{customerName || 'Müşteri'}</h1>
                <button
                    onClick={() => setShowCart(true)}
                    className="relative bg-blue-600 px-3 py-1 rounded text-xs font-bold"
                >
                    SEPET ({cart.reduce((a, b) => a + b.qty, 0)})
                </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-white/5">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Ürün ara..."
                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none"
                />
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
                {products?.map(product => (
                    <div key={product.id} className="bg-[#161b22] border border-white/5 p-4 rounded-xl flex justify-between items-center">
                        <div>
                            <div className="font-bold">{product.name}</div>
                            <div className="text-xs text-gray-400">{product.category}</div>
                            <div className="font-bold text-blue-400 mt-1">
                                ₺{getPriceForProduct(product).toLocaleString()}
                                {customer?.priceListId && product.prices?.some((p: any) => p.priceListId === customer.priceListId) && (
                                    <span className="ml-2 text-[8px] bg-blue-500/20 px-1 py-0.5 rounded text-blue-300 uppercase font-black">Özel</span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => addToCart(product)}
                            className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-bold text-sm"
                        >
                            EKLE
                        </button>
                    </div>
                ))}
                {products?.length === 0 && (
                    <div className="text-center opacity-50 py-10">Ürün bulunamadı.</div>
                )}
            </div>

            {/* Cart Modal / Sheet */}
            {showCart && (
                <div className="fixed inset-0 bg-black/90 z-50 flex flex-col animate-in slide-in-from-bottom duration-200">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#161b22]">
                        <h2 className="font-bold">Sepetim</h2>
                        <button onClick={() => setShowCart(false)} className="text-gray-400">Kapat</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {cart.length === 0 ? (
                            <div className="text-center opacity-50 py-20">Sepetiniz boş.</div>
                        ) : (
                            cart.map(item => (
                                <div key={item.productId} className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                                    <div className="flex-1">
                                        <div className="font-bold text-sm">{item.name}</div>
                                        <div className="text-xs opacity-50">₺{item.price} x {item.qty}</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => updateQty(item.productId, -1)} className="w-8 h-8 bg-white/10 rounded-full font-bold">-</button>
                                        <span className="font-bold w-4 text-center">{item.qty}</span>
                                        <button onClick={() => updateQty(item.productId, +1)} className="w-8 h-8 bg-white/10 rounded-full font-bold">+</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 bg-[#161b22] border-t border-white/10 safe-area-bottom">
                        <div className="flex justify-between items-end mb-4">
                            <span className="text-sm opacity-50">Toplam Tutar</span>
                            <span className="text-2xl font-black text-blue-400">₺{cartTotal.toLocaleString()}</span>
                        </div>
                        <button
                            onClick={handleSaveOrder}
                            disabled={cart.length === 0 || saving}
                            className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-900/20 transition-all"
                        >
                            {saving ? 'Kaydediliyor...' : 'SİPARİŞİ TAMAMLA'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
