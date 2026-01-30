"use client";

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';

interface PurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplierId: string;
    supplierName: string;
    onSuccess?: () => void;
}

export default function SupplierPurchaseModal({ isOpen, onClose, supplierId, supplierName, onSuccess }: PurchaseModalProps) {
    const { products } = useApp();
    const { showSuccess, showError } = useModal();
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);

    // Purchase Invoice State
    const [purchaseData, setPurchaseData] = useState({
        amount: 0,
        invoiceNo: '',
        description: '',
        items: [] as any[]
    });

    // New Product Form State (Match Inventory Page)
    const [newProduct, setNewProduct] = useState({
        code: '', productCode: '', barcode: '', name: '', brand: '', category: 'Motosiklet', type: 'Diğer',
        stock: 0, price: 0, buyPrice: 0, status: 'ok', supplier: supplierName,
        gtip: '', gtin: '',
        salesVat: 20, salesVatIncluded: true, purchaseVat: 20, purchaseVatIncluded: true
    });

    const [isProcessing, setIsProcessing] = useState(false);

    const handleManualPurchase = async () => {
        const totalAmount = purchaseData.items.reduce((acc, item) => acc + (item.price * item.qty), 0) || purchaseData.amount;

        if (totalAmount === 0 && purchaseData.items.length === 0) {
            showError('Hata', 'Lütfen geçerli bir tutar veya ürün giriniz!');
            return;
        }

        if (isProcessing) return;
        setIsProcessing(true);
        try {
            const res = await fetch('/api/suppliers/transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplierId: supplierId,
                    type: 'PURCHASE',
                    amount: totalAmount,
                    invoiceNo: purchaseData.invoiceNo,
                    description: purchaseData.description,
                    items: purchaseData.items
                })
            });
            const result = await res.json();
            if (result.success) {
                showSuccess('Başarılı', '✅ Alış kaydedildi.');
                onClose();
                if (onSuccess) onSuccess();
                else window.location.reload();
            } else {
                showError('Hata', 'Hata: ' + result.error);
            }
        } catch (e: any) {
            showError('Hata', 'Sistem hatası!');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAddQuickProduct = async () => {
        if (isProcessing) return;

        // Validation
        const mandatoryFields = [
            { field: 'name', label: 'Ürün Adı' },
            { field: 'code', label: 'Stok Kodu' },
            { field: 'buyPrice', label: 'Alış Fiyatı' },
            { field: 'price', label: 'Satış Fiyatı' }
        ];

        for (const item of mandatoryFields) {
            if (!newProduct[item.field as keyof typeof newProduct] && newProduct[item.field as keyof typeof newProduct] !== 0) {
                showError('Zorunlu Alan', `${item.label} alanı zorunludur!`);
                return;
            }
        }

        setIsProcessing(true);
        try {
            // We set stock to 0 for creation, because it will be added via the purchase invoice item
            // However, we use the entered 'stock' value as the quantity for the invoice item
            const prodToCreate = {
                ...newProduct,
                stock: 0, // Initial stock is 0, will be incremented by purchase
                supplier: supplierName // Ensure supplier is linked
            };

            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prodToCreate)
            });
            const data = await res.json();

            if (data.success) {
                showSuccess('Başarılı', '✅ Ürün oluşturuldu ve listeye eklendi.');

                // Add to purchase items list with the entered quantity
                const createdProduct = data.product;
                const enteredQty = newProduct.stock > 0 ? newProduct.stock : 1; // Default to 1 if 0 entered

                addItemToPurchase(createdProduct, enteredQty);

                setIsProductModalOpen(false);
                // Reset form
                setNewProduct({
                    code: '', productCode: '', barcode: '', name: '', brand: '', category: 'Motosiklet', type: 'Diğer',
                    stock: 0, price: 0, buyPrice: 0, status: 'ok', supplier: supplierName,
                    gtip: '', gtin: '',
                    salesVat: 20, salesVatIncluded: true, purchaseVat: 20, purchaseVatIncluded: true
                });

                // Optional: Reload page or refresh products list if needed, 
                // but since we add directly to invoice items, immediate refresh isn't strictly necessary for the flow
                window.location.reload(); // Reloading to refresh product list context
            } else {
                showError('Hata', 'Hata: ' + (data.error || 'Bilinmeyen hata'));
            }
        } catch (e) {
            showError('Hata', 'Bir hata oluştu!');
        } finally {
            setIsProcessing(false);
        }
    };

    const addItemToPurchase = (prod: any, qtyOverride?: number) => {
        const quantity = qtyOverride || 1;
        const existing = purchaseData.items.find(i => i.productId === prod.id);
        if (existing) {
            setPurchaseData({
                ...purchaseData,
                items: purchaseData.items.map(i => i.productId === prod.id ? { ...i, qty: i.qty + quantity } : i)
            });
        } else {
            setPurchaseData({
                ...purchaseData,
                items: [...purchaseData.items, { productId: prod.id, name: prod.name, qty: quantity, price: prod.buyPrice || 0 }]
            });
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>

                {/* MAIN PURCHASE MODAL */}
                <div className="card glass animate-in" style={{ width: '900px', maxWidth: '95vw', background: 'var(--bg-card)', display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.5fr', gap: '20px', padding: '24px' }}>
                    <div className="flex-col gap-4">
                        <div className="flex-between">
                            <h3>🛒 Alış Faturası Girişi</h3>
                            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>×</button>
                        </div>
                        <p className="text-muted" style={{ fontSize: '12px' }}>Tedarikçi: <b>{supplierName}</b></p>

                        <div>
                            <label className="text-muted" style={{ fontSize: '11px' }}>FATURA NO / REF</label>
                            <input type="text" placeholder="Örn: ABC-12345" value={purchaseData.invoiceNo} onChange={e => setPurchaseData({ ...purchaseData, invoiceNo: e.target.value })} style={{ width: '100%', padding: '10px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white' }} />
                        </div>

                        <div className="flex-col gap-2">
                            <label className="text-muted" style={{ fontSize: '11px' }}>ÜRÜN KATALOĞU (Envanter)</label>
                            <div style={{ maxHeight: '350px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                                {products.length > 0 ? products.map(p => (
                                    <div key={p.id} onClick={() => addItemToPurchase(p)} className="flex-between hover-bg-item" style={{ padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div className="flex-col">
                                            <span>{p.name}</span>
                                            <small style={{ color: 'var(--text-muted)' }}>{p.code} | Stok: {p.stock}</small>
                                        </div>
                                        <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{p.buyPrice} ₺</span>
                                    </div>
                                )) : (
                                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                                        Ürün bulunamadı. Lütfen yeni ürün ekleyin.
                                    </div>
                                )}
                            </div>
                            <button onClick={() => setIsProductModalOpen(true)} className="btn btn-outline" style={{ borderStyle: 'dashed', fontSize: '12px', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '16px' }}>✨</span> Listede Yok Mu? Yeni Ürün Ekle
                            </button>
                        </div>
                    </div>

                    <div className="flex-col gap-4" style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
                        <div className="flex-between">
                            <h4>Fatura Kalemleri</h4>
                            <span className="text-muted" style={{ fontSize: '12px' }}>{purchaseData.items.length} Ürün</span>
                        </div>
                        <div className="flex-col gap-2" style={{ minHeight: '200px', maxHeight: '300px', overflowY: 'auto' }}>
                            {purchaseData.items.map((item, idx) => (
                                <div key={idx} className="flex-between" style={{ fontSize: '13px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '500' }}>{item.name}</div>
                                        <div className="flex-center gap-2" style={{ marginTop: '5px' }}>
                                            <input type="number" min="1" value={item.qty} onChange={e => {
                                                const newItems = [...purchaseData.items];
                                                newItems[idx].qty = parseInt(e.target.value) || 1;
                                                setPurchaseData({ ...purchaseData, items: newItems });
                                            }} style={{ width: '50px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', color: 'white', borderRadius: '4px', textAlign: 'center' }} />
                                            <span className="text-muted">adet x</span>
                                            <input type="number" value={item.price} onChange={e => {
                                                const newItems = [...purchaseData.items];
                                                newItems[idx].price = parseFloat(e.target.value) || 0;
                                                setPurchaseData({ ...purchaseData, items: newItems });
                                            }} style={{ width: '80px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', color: 'white', borderRadius: '4px', textAlign: 'center' }} />
                                            <span>₺</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setPurchaseData({ ...purchaseData, items: purchaseData.items.filter((_, i) => i !== idx) })} style={{ color: 'var(--danger)', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', marginLeft: '10px' }}>×</button>
                                </div>
                            ))}
                            {purchaseData.items.length === 0 && (
                                <div style={{ textAlign: 'center', marginTop: '60px' }}>
                                    <div style={{ fontSize: '24px', marginBottom: '10px' }}>📦</div>
                                    <p className="text-muted">Fatura henüz boş. Ürün seçin veya manuel tutar girin.</p>
                                </div>
                            )}
                        </div>

                        <div className="divider" style={{ height: '1px', background: 'var(--border-light)', margin: '15px 0' }}></div>

                        <div className="flex-between">
                            <span>GENEL TOPLAM:</span>
                            <span style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--primary)' }}>
                                {(purchaseData.items.reduce((acc, item) => acc + (item.price * item.qty), 0) || purchaseData.amount).toLocaleString()} ₺
                            </span>
                        </div>

                        {purchaseData.items.length === 0 && (
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px' }}>
                                <label className="text-muted" style={{ fontSize: '11px' }}>MANUEL TUTAR GİRİŞİ (Hızlı Giriş İçin)</label>
                                <input type="number" placeholder="0.00" value={purchaseData.amount || ''} onChange={e => setPurchaseData({ ...purchaseData, amount: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--primary)', borderRadius: '8px', color: 'white', fontSize: '18px' }} />
                            </div>
                        )}

                        <div className="flex-end gap-3 mt-4">
                            <button onClick={onClose} disabled={isProcessing} className="btn btn-outline" style={{ padding: '12px 24px' }}>Vazgeç</button>
                            <button onClick={handleManualPurchase} disabled={isProcessing} className="btn btn-primary" style={{ flex: 1, padding: '12px', background: 'var(--primary)' }}>
                                {isProcessing ? 'İŞLENİYOR...' : 'Faturayı Sisteme İşle'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ADVANCED ADD PRODUCT MODAL (MATCHING INVENTORY PAGE) */}
                {isProductModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(10px)' }}>
                        <div className="card glass animate-slide-up" style={{ width: '700px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', borderRadius: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div className="flex-between mb-8">
                                <div className="flex-center gap-4">
                                    <div style={{ width: '48px', height: '48px', background: 'var(--primary)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>✨</div>
                                    <div>
                                        <h2 style={{ fontSize: '22px', fontWeight: '800' }}>Yeni Ürün Tanımla</h2>
                                        <p className="text-muted" style={{ fontSize: '12px' }}>Envanterinize yeni bir parça ekleyin ve faturaya yansıtın</p>
                                    </div>
                                </div>
                                <button style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer' }} onClick={() => setIsProductModalOpen(false)}>&times;</button>
                            </div>

                            <div className="grid-cols-2 gap-x-6 gap-y-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                                {[
                                    { label: 'Ürün Adı', key: 'name', placeholder: 'Örn: Yamaha Fren Balatası' },
                                    { label: 'Stok Kodu (SKU)', key: 'code', placeholder: 'SKU-0001' },
                                    { label: 'Üretim Kodu', key: 'productCode', placeholder: 'P-998-X' },
                                    { label: 'Barkod', key: 'barcode', placeholder: 'EAN-13' }
                                ].map(field => (
                                    <div className="flex-col gap-2" key={field.key}>
                                        <label className="text-muted" style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1px' }}>{field.label.toUpperCase()}</label>
                                        <input
                                            placeholder={field.placeholder}
                                            value={(newProduct as any)[field.key]}
                                            onChange={e => setNewProduct({ ...newProduct, [field.key]: e.target.value })}
                                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px', color: 'white', width: '100%' }}
                                        />
                                    </div>
                                ))}

                                <div className="flex-col gap-2">
                                    <label className="text-muted" style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1px' }}>MARKA</label>
                                    <select value={newProduct.brand} onChange={e => setNewProduct({ ...newProduct, brand: e.target.value })} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px', color: 'white', width: '100%' }}>
                                        <option value="">Seçiniz</option>
                                        <option>Yamaha</option><option>Honda</option><option>Motul</option><option>Shimano</option>
                                    </select>
                                </div>

                                <div className="flex-col gap-2">
                                    <label className="text-muted" style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1px' }}>KATEGORİ</label>
                                    <select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px', color: 'white', width: '100%' }}>
                                        <option>Motosiklet</option><option>Bisiklet</option><option>Yağ/Sıvı</option><option>Ekipman</option>
                                    </select>
                                </div>

                                <div className="flex-col gap-2">
                                    <label className="text-muted" style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1px' }}>BAŞLANGIÇ STOĞU (FATURA MİKTARI)</label>
                                    <input type="number" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
                                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px', color: 'white', width: '100%' }} />
                                    <small className="text-muted" style={{ fontSize: '10px' }}>Bu miktar alış faturasına eklenecektir.</small>
                                </div>

                                <div className="flex-col gap-2">
                                    <label className="text-muted" style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1px' }}>TEDARİKÇİ</label>
                                    <input placeholder="Firma Adı" value={newProduct.supplier} disabled
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px', color: 'var(--text-muted)', width: '100%', cursor: 'not-allowed' }} />
                                </div>

                                <div className="flex-col gap-2">
                                    <label className="text-muted" style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1px' }}>ALIŞ FİYATI (₺)</label>
                                    <input type="number" value={newProduct.buyPrice} onChange={e => setNewProduct({ ...newProduct, buyPrice: parseFloat(e.target.value) || 0 })}
                                        style={{ background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '12px', padding: '12px', color: 'white', fontWeight: 'bold', width: '100%' }} />
                                </div>

                                <div className="flex-col gap-2">
                                    <label className="text-muted" style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1px' }}>SATIŞ FİYATI (₺)</label>
                                    <input type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                                        style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', padding: '12px', color: 'white', fontWeight: 'bold', width: '100%' }} />
                                </div>
                            </div>

                            <div className="flex-end gap-3 mt-10">
                                <button className="btn btn-outline" style={{ borderRadius: '14px', padding: '12px 30px' }} onClick={() => setIsProductModalOpen(false)}>İptal</button>
                                <button className="btn btn-primary" style={{ borderRadius: '14px', padding: '12px 40px', background: 'var(--primary)', boxShadow: '0 8px 20px -5px rgba(59, 130, 246, 0.5)', opacity: isProcessing ? 0.7 : 1 }} onClick={handleAddQuickProduct} disabled={isProcessing}>
                                    {isProcessing ? 'İŞLENİYOR...' : 'KAYDI TAMAMLA'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <style jsx>{`
                    .hover-bg-item:hover { background: rgba(255, 255, 255, 0.05); }
                    .flex-center { display: flex; align-items: center; }
                    .flex-between { display: flex; align-items: center; justify-content: space-between; }
                    .flex-col { display: flex; flex-direction: column; }
                    .flex-end { display: flex; align-items: center; justify-content: flex-end; }
                    .gap-1 { gap: 4px; }
                    .gap-2 { gap: 8px; }
                    .gap-3 { gap: 12px; }
                    .gap-4 { gap: 16px; }
                `}</style>
            </div>
        </>
    );
}
