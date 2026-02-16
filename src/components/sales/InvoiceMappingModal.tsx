
"use client";

import { Fragment } from 'react';

interface InvoiceMappingModalProps {
    selectedOrder: any;
    setSelectedOrder: (order: any) => void;
    isLoadingMapping: boolean;
    mappedItems: { [key: string]: number };
    setMappedItems: (items: any) => void;
    inventoryProducts: any[];
    finalizeInvoice: () => void;
}

export function InvoiceMappingModal({
    selectedOrder,
    setSelectedOrder,
    isLoadingMapping,
    mappedItems,
    setMappedItems,
    inventoryProducts,
    finalizeInvoice
}: InvoiceMappingModalProps) {
    if (!selectedOrder) return null;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card glass" style={{ width: '700px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-card)' }}>
                <div className="flex-between mb-6">
                    <h3>📑 Sipariş & Stok Eşleştirme</h3>
                    <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px' }}>×</button>
                </div>

                {isLoadingMapping ? (
                    <div className="flex-center p-8"><span className="loader"></span> Kontrol ediliyor...</div>
                ) : (
                    <div className="flex-col gap-4">
                        <div className="alert alert-info py-2" style={{ fontSize: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            ℹ️ Eşleştirilmeyen ürünler için stok kartını seçiniz. Seçimleriniz kaydedilecek ve bir dahaki sefere otomatik tanınacaktır.
                        </div>

                        <div className="card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-light)' }}>
                            <div className="grid-cols-3 text-muted mb-2 px-2" style={{ fontSize: '11px', display: 'grid', gridTemplateColumns: '2fr 1fr 2fr' }}>
                                <div>PAZARYERİ ÜRÜN</div>
                                <div className="text-center">ADET</div>
                                <div>STOK KARTI (ENVANTER)</div>
                            </div>

                            {selectedOrder.items.map((item: any, idx: number) => {
                                const isMapped = !!mappedItems[item.name];
                                return (
                                    <div key={idx} className="flex-between py-3 px-2" style={{
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        display: 'grid',
                                        gridTemplateColumns: '2fr 1fr 2fr',
                                        gap: '10px',
                                        alignItems: 'center',
                                        background: isMapped ? 'rgba(16, 185, 129, 0.05)' : 'transparent'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{item.name}</div>
                                            <div className="text-muted" style={{ fontSize: '10px' }}>Kod: {item.code || item.barcode || '-'}</div>
                                        </div>

                                        <div className="text-center" style={{ fontWeight: '900', fontSize: '14px' }}>
                                            x{item.qty || item.quantity}
                                        </div>

                                        <div style={{ width: '100%' }}>
                                            <select
                                                style={{
                                                    width: '100%',
                                                    padding: '8px',
                                                    background: isMapped ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-card)',
                                                    color: isMapped ? 'var(--success)' : 'var(--text-main)',
                                                    border: isMapped ? '1px solid var(--success)' : '1px solid var(--warning)',
                                                    borderRadius: '6px',
                                                    fontSize: '12px'
                                                }}
                                                value={mappedItems[item.name] || ''}
                                                onChange={(e) => setMappedItems({ ...mappedItems, [item.name]: e.target.value })}
                                            >
                                                <option value="">-- Eşleştirme Seçin --</option>
                                                {inventoryProducts.map(inv => (
                                                    <option key={inv.id} value={inv.id}>
                                                        {inv.name} ({inv.stock} Adet)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            onClick={finalizeInvoice}
                            className="btn btn-primary w-full"
                            style={{ padding: '16px', fontWeight: 'bold', marginTop: '20px', fontSize: '15px' }}
                            disabled={isLoadingMapping || selectedOrder.items.some((i: any) => !mappedItems[i.name])}
                        >
                            {isLoadingMapping ? '⌛ İŞLENİYOR...' : (selectedOrder.items.some((i: any) => !mappedItems[i.name]) ?
                                '⚠️ Lütfen Eşleştirme Seçin' :
                                '✅ KAYDET VE FATURAYI OLUŞTUR')
                            }
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
