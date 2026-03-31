"use client";

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useInventory } from '@/contexts/InventoryContext';
import { useModal } from '@/contexts/ModalContext';
import { EnterpriseInput, EnterpriseSelect, EnterpriseButton } from '@/components/ui/enterprise';

interface PurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplierId: string;
    supplierName: string;
    onSuccess?: () => void;
}

export default function SupplierPurchaseModal({ isOpen, onClose, supplierId, supplierName, onSuccess }: PurchaseModalProps) {
    const { products } = useInventory();
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
                items: purchaseData.items?.map(i => i.productId === prod.id ? { ...i, qty: i.qty + quantity } : i)
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
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[1000]">

                {/* MAIN PURCHASE MODAL */}
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 shadow-2xl rounded-[24px] w-full max-w-[900px] flex flex-col md:flex-row gap-6 p-6 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex flex-col gap-5 w-full md:w-[40%]">
                        <div className="flex items-center justify-between">
<h3 className="text-[18px] font-black text-slate-800 dark:text-white m-0 tracking-tight flex items-center gap-2">🛒 Manuel Alış Faturası</h3>
<button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>×</button>
                        </div>
                        <p className="text-[12px] font-medium text-slate-500 m-0">Tedarikçi: <b className="text-slate-700 dark:text-slate-300">{supplierName}</b></p>

                        <div>
                            <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">FATURA NO / REF</label>
                            <EnterpriseInput placeholder="Örn: ABC-12345" value={purchaseData.invoiceNo} onChange={e => setPurchaseData({ ...purchaseData, invoiceNo: e.target.value })} />
                        </div>

                        <div className="flex flex-col gap-3">
                            <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5 line-clamp-1">ÜRÜN KATALOĞU (Envanter)</label>
                            <div className="max-h-[350px] overflow-y-auto custom-scroll bg-white dark:bg-slate-800/50 p-2 rounded-[16px] border border-slate-200 dark:border-white/10">
                                {products.length > 0 ? products?.map(p => (
                                    <div key={p.id} onClick={() => addItemToPurchase(p)} className="flex items-center justify-between p-3 rounded-[12px] cursor-pointer text-[12px] border-b border-transparent hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                        <div className="flex-col">
                                            <span>{p.name}</span>
                                            <small className="text-slate-500 dark:text-slate-400 font-semibold">{p.code} | Stok: <span className="text-slate-700 dark:text-slate-300">{p.stock}</span></small>
                                        </div>
                                        <span className="text-blue-600 dark:text-blue-400 font-black whitespace-nowrap">{p.buyPrice} ₺</span>
                                    </div>
                                )) : (
                                    <div className="p-5 text-center text-slate-500 font-semibold text-[13px]">
                                        Ürün bulunamadı. Lütfen yeni ürün ekleyin.
                                    </div>
                                )}
                            </div>
                            <button onClick={() => setIsProductModalOpen(true)} className="h-[48px] w-full mt-2 bg-transparent border-2 border-dashed border-slate-300 dark:border-white/20 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 font-bold text-[13px] rounded-[12px] flex items-center justify-center gap-2 transition-all">
                                <span style={{ fontSize: '16px' }}>✨</span> Listede Yok Mu? Yeni Ürün Ekle
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6 w-full md:w-[60%] bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[20px] border border-slate-100 dark:border-white/5 relative">
    <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 hidden md:flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 transition-colors text-[24px]">&times;</button>
    
                        <div className="flex justify-between items-center pr-10 md:pr-12">
        <h4 className="text-[15px] font-black text-slate-800 dark:text-white m-0">Fatura Kalemleri</h4>
        <span className="text-[12px] font-bold text-slate-500 bg-slate-200/50 dark:bg-white/10 px-2 py-1 rounded-[6px]">{purchaseData.items.length} Ürün</span>
    </div>
                        <div className="flex flex-col gap-3 min-h-[200px] max-h-[300px] overflow-y-auto custom-scroll pr-1">
                            {purchaseData.items?.map((item, idx) => (
                                <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 text-[13px] bg-white dark:bg-[#0f172a] p-3 md:p-4 rounded-[16px] border border-slate-200 dark:border-white/10 shadow-sm relative">
                                    <div style={{ flex: 1 }}>
                                        <div className="font-bold text-slate-800 dark:text-white text-[13px] mb-2">{item.name}</div>
                                        <div className="flex items-center gap-2">
                                            <input type="number" min="1" value={item.qty} onChange={e => {
                                                const newItems = [...purchaseData.items];
                                                newItems[idx].qty = parseInt(e.target.value) || 1;
                                                setPurchaseData({ ...purchaseData, items: newItems });
                                            }} className="w-[50px] h-[32px] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-[8px] font-bold text-center outline-none focus:border-blue-500" />
                                            <span className="text-[11px] font-bold text-slate-400">adet x</span>
                                            <input type="number" value={item.price} onChange={e => {
                                                const newItems = [...purchaseData.items];
                                                newItems[idx].price = parseFloat(e.target.value) || 0;
                                                setPurchaseData({ ...purchaseData, items: newItems });
                                            }} className="w-[80px] h-[32px] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-[8px] font-bold text-center outline-none focus:border-blue-500" />
                                            <span>₺</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setPurchaseData({ ...purchaseData, items: purchaseData.items.filter((_, i) => i !== idx) })} className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-[20px] absolute right-2 top-2 sm:relative sm:right-auto sm:top-auto shrink-0">&times;</button>
                                </div>
                            ))}
                            {purchaseData.items.length === 0 && (
                                <div className="text-center mt-12 flex flex-col items-center justify-center">
                                    <div className="text-[32px] mb-3">📦</div>
                                    <p className="text-[13px] font-medium text-slate-500">Fatura henüz boş. Ürün seçin veya manuel tutar girin.</p>
                                </div>
                            )}
                        </div>

                        <div className="h-[1px] w-full bg-slate-200 dark:bg-white/10 my-1"></div>

                        <div className="flex justify-between items-center bg-white dark:bg-[#0f172a] p-4 rounded-[16px] border border-slate-200 dark:border-white/10 shadow-sm">
<span className="text-[11px] font-black uppercase tracking-widest text-slate-500">GENEL TOPLAM:</span>
                            <span className="text-[24px] md:text-[28px] font-black text-blue-600 dark:text-blue-400 tracking-tight">
                                {(purchaseData.items.reduce((acc, item) => acc + (item.price * item.qty), 0) || purchaseData.amount).toLocaleString()} ₺
                            </span>
                        </div>

                        {purchaseData.items.length === 0 && (
                            <div className="bg-white dark:bg-[#0f172a] p-4 rounded-[16px] border border-slate-200 dark:border-white/10">
                                <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2">MANUEL TUTAR GİRİŞİ (Hızlı Giriş İçin)</label>
                                <EnterpriseInput type="number" placeholder="0.00" value={purchaseData.amount || ''} onChange={e => setPurchaseData({ ...purchaseData, amount: parseFloat(e.target.value) || 0 })} />
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-3 mt-auto pt-4">
                            <EnterpriseButton variant="secondary" onClick={onClose} disabled={isProcessing}>Vazgeç</EnterpriseButton>
                            <EnterpriseButton onClick={handleManualPurchase} disabled={isProcessing}>{isProcessing ? 'İŞLENİYOR...' : 'Faturayı Sisteme İşle'}</EnterpriseButton>
                        </div>
                    </div>
                </div>

                {/* ADVANCED ADD PRODUCT MODAL (MATCHING INVENTORY PAGE) */}
                {isProductModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[1100]">
                        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 shadow-2xl rounded-[24px] w-full max-w-[700px] max-h-[90vh] overflow-y-auto custom-scroll animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                                <div className="flex items-center gap-4">
                                    <div className="w-[48px] h-[48px] bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-[14px] flex items-center justify-center text-[24px]">✨</div>
                                    <div>
                                        <h2 className="text-[18px] font-black tracking-tight text-slate-800 dark:text-white m-0">Yeni Ürün Tanımla</h2>
                                        <p className="text-[12px] font-medium text-slate-500 m-0 mt-0.5">Envanterinize yeni bir parça ekleyin ve faturaya yansıtın</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsProductModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 transition-colors text-[24px]">&times;</button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-6">
                                {[
                                    { label: 'Ürün Adı', key: 'name', placeholder: 'Örn: Yamaha Fren Balatası' },
                                    { label: 'Stok Kodu (SKU)', key: 'code', placeholder: 'SKU-0001' },
                                    { label: 'Üretim Kodu', key: 'productCode', placeholder: 'P-998-X' },
                                    { label: 'Barkod', key: 'barcode', placeholder: 'EAN-13' }
                                ]?.map(field => (
                                    <div className="flex-col gap-2" key={field.key}>
                                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">{field.label.toUpperCase()}</label>
                                        <input
                                            placeholder={field.placeholder}
                                            value={(newProduct as any)[field.key]}
                                            onChange={e => setNewProduct({ ...newProduct, [field.key]: e.target.value })}
                                            className="w-full h-[48px] px-4 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[12px] text-[14px] font-bold text-slate-800 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-colors"
                                        />
                                    </div>
                                ))}

                                <div className="flex flex-col gap-3">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">MARKA</label>
                                    <EnterpriseSelect value={newProduct.brand || ''} onChange={e => setNewProduct({ ...newProduct, brand: e.target.value })}>
<option value="">Seçiniz</option>
                                        <option>Yamaha</option><option>Honda</option><option>Motul</option><option>Shimano</option>
                                    
                                    </EnterpriseSelect>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">KATEGORİ</label>
                                    <EnterpriseSelect value={newProduct.category || ''} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}>
<option>Motosiklet</option><option>Bisiklet</option><option>Yağ/Sıvı</option><option>Ekipman</option>
                                    
                                    </EnterpriseSelect>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">BAŞLANGIÇ STOĞU (FATURA MİKTARI)</label>
                                    <input type="number" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
                                        className="w-full h-[48px] px-4 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[12px] text-[14px] font-bold text-slate-800 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-colors" />
                                    <small className="text-[10px] font-bold text-slate-400 block mt-1">Bu miktar alış faturasına eklenecektir.</small>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">TEDARİKÇİ</label>
                                    <input placeholder="Firma Adı" value={newProduct.supplier} disabled
                                        className="w-full h-[48px] px-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[12px] text-[14px] font-bold text-slate-500 dark:text-slate-500 cursor-not-allowed outline-none" />
                                </div>

                                <div className="flex flex-col gap-3">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">ALIŞ FİYATI (₺)</label>
                                    <input type="number" value={newProduct.buyPrice} onChange={e => setNewProduct({ ...newProduct, buyPrice: parseFloat(e.target.value) || 0 })}
                                        className="w-full h-[48px] px-4 bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-200 dark:border-emerald-500/20 rounded-[12px] text-[15px] font-black text-emerald-700 dark:text-emerald-400 focus:border-emerald-500 outline-none transition-colors" />
                                </div>

                                <div className="flex flex-col gap-3">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">SATIŞ FİYATI (₺)</label>
                                    <input type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                                        className="w-full h-[48px] px-4 bg-blue-50 dark:bg-blue-500/10 border-2 border-blue-200 dark:border-blue-500/20 rounded-[12px] text-[15px] font-black text-blue-700 dark:text-blue-400 focus:border-blue-500 outline-none transition-colors" />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50 mt-4 rounded-b-[24px]">
                                <EnterpriseButton variant="secondary" onClick={() => setIsProductModalOpen(false)}>İptal</EnterpriseButton>
                                <EnterpriseButton onClick={handleAddQuickProduct} disabled={isProcessing}>{isProcessing ? 'İŞLENİYOR...' : 'KAYDI TAMAMLA'}</EnterpriseButton>
                            </div>
                        </div>
                    </div>
                )}

                
            </div>
        </>
    );
}
