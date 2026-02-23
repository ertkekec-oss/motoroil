
"use client";

import { Fragment, useState } from 'react';
import { apiFetch } from '@/lib/api-client';

interface InvoiceMappingModalProps {
    selectedOrder: any;
    setSelectedOrder: (order: any) => void;
    isLoadingMapping: boolean;
    mappedItems: { [key: string]: any }; // itemName → { productId, status }
    setMappedItems: (items: any) => void;
    inventoryProducts: any[];
    finalizeInvoice: () => void;
    // New: raw API mapping results (keyed by item code)
    rawMappings?: Record<string, any>;
}

// Inline "New Product" quick-create form state (per item)
interface QuickCreateState {
    name: string;
    code: string;
    stock: string;
    price: string;
}

const SCORE_COLORS: Record<string, string> = {
    mapped: '#02C951',  // green
    suggest: '#F59E0B',  // amber
    notFound: '#E53E3E',  // red
};
const SCORE_LABELS: Record<string, string> = {
    mapped: '✅ Otomatik Eşleşti',
    suggest: '⚠️ Öneri — Doğrula',
    notFound: '❌ Stokta Bulunamadı',
};

export function InvoiceMappingModal({
    selectedOrder,
    setSelectedOrder,
    isLoadingMapping,
    mappedItems,
    setMappedItems,
    inventoryProducts,
    finalizeInvoice,
    rawMappings = {},
}: InvoiceMappingModalProps) {
    if (!selectedOrder) return null;

    const [quickCreate, setQuickCreate] = useState<Record<string, QuickCreateState | null>>({});
    const [isCreating, setIsCreating] = useState<string | null>(null);

    // Get the mapping status for a given item
    const getMappingInfo = (item: any) => {
        const key = item.code || item.barcode || item.name;
        return rawMappings[key] || { status: 'notFound', score: 0, suggestions: [], marketplaceName: item.name };
    };

    const allMapped = selectedOrder.items.every((i: any) => {
        const mapped = mappedItems[i.name];
        return mapped && mapped.productId;
    });

    const handleCreateProduct = async (itemName: string, form: QuickCreateState) => {
        if (!form.name) return;
        setIsCreating(itemName);
        try {
            const res = await apiFetch('/api/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    code: form.code || undefined,
                    stock: parseFloat(form.stock) || 0,
                    price: parseFloat(form.price) || 0,
                    source: 'marketplace_mapping',
                })
            });
            const data = await res.json();
            if (data.success && data.product) {
                // Auto-select new product
                setMappedItems({ ...mappedItems, [itemName]: { productId: data.product.id, status: 'new' } });
                setQuickCreate({ ...quickCreate, [itemName]: null }); // close form
                inventoryProducts.push(data.product); // optimistic push
            } else {
                alert('Ürün oluşturulamadı: ' + (data.error || 'Bilinmeyen hata'));
            }
        } catch (e: any) {
            alert('Hata: ' + e.message);
        } finally {
            setIsCreating(null);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.82)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <div className="card glass" style={{ width: '760px', maxHeight: '92vh', overflowY: 'auto', background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-light)' }}>

                {/* Header */}
                <div className="flex-between" style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-light)' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>📑 Akıllı Ürün Eşleştirme</h3>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                            Sipariş #{selectedOrder.orderNumber} · {selectedOrder.marketplace}
                        </p>
                    </div>
                    <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '24px', cursor: 'pointer', lineHeight: 1 }}>×</button>
                </div>

                {isLoadingMapping ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '32px', marginBottom: '16px' }}>🤖</div>
                        <p>AI ürünleri tarıyor ve eşleştiriyor...</p>
                        <p style={{ fontSize: '12px', opacity: 0.6 }}>Stok veritabanınızla karşılaştırılıyor</p>
                    </div>
                ) : (
                    <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Legend */}
                        <div style={{ display: 'flex', gap: '16px', fontSize: '11px', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <span style={{ color: SCORE_COLORS.mapped }}>✅ Otomatik eşleşti</span>
                            <span style={{ color: SCORE_COLORS.suggest }}>⚠️ Öneri var — doğrula</span>
                            <span style={{ color: SCORE_COLORS.notFound }}>❌ Bulunamadı — kart oluştur</span>
                        </div>

                        {/* Items */}
                        {selectedOrder.items.map((item: any, idx: number) => {
                            const info = getMappingInfo(item);
                            const currentMap = mappedItems[item.name];
                            const isDone = !!(currentMap?.productId);
                            const statusColor = isDone ? SCORE_COLORS.mapped : SCORE_COLORS[info.status];
                            const showCreate = quickCreate[item.name] !== undefined && quickCreate[item.name] !== null;

                            return (
                                <div key={idx} style={{
                                    background: isDone ? 'rgba(2,201,81,0.06)' : (info.status === 'suggest' ? 'rgba(245,158,11,0.06)' : 'rgba(229,62,62,0.04)'),
                                    border: `1px solid ${isDone ? 'rgba(2,201,81,0.2)' : (info.status === 'suggest' ? 'rgba(245,158,11,0.2)' : 'rgba(229,62,62,0.15)')}`,
                                    borderRadius: '14px',
                                    padding: '16px 18px',
                                }}>
                                    {/* Row: marketplace item */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '12px' }}>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)', marginBottom: '3px' }}>{item.name}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                Kod: {item.code || item.barcode || '—'} · Adet: <strong>x{item.qty || item.quantity || 1}</strong>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '11px', fontWeight: '700', color: statusColor, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                                {isDone ? '✅ Eşleştirildi' : SCORE_LABELS[info.status]}
                                            </div>
                                            {info.score > 0 && <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Skor: {info.score}/100</div>}
                                        </div>
                                    </div>

                                    {/* Match selector */}
                                    {info.status === 'suggest' && !isDone && (
                                        <div style={{ fontSize: '12px', color: SCORE_COLORS.suggest, marginBottom: '8px', padding: '6px 10px', background: 'rgba(245,158,11,0.1)', borderRadius: '8px' }}>
                                            💡 AI önerisi: <strong>{info.internalProduct?.name}</strong> (skor: {info.score}) — lütfen doğrulayın veya başka ürün seçin
                                        </div>
                                    )}

                                    {info.status !== 'notFound' || isDone ? (
                                        <select
                                            style={{
                                                width: '100%', padding: '10px 12px', borderRadius: '10px',
                                                background: isDone ? 'rgba(2,201,81,0.1)' : 'var(--bg-card)',
                                                border: isDone ? '1px solid rgba(2,201,81,0.4)' : '1px solid rgba(245,158,11,0.4)',
                                                color: isDone ? 'var(--success)' : 'var(--text-main)',
                                                fontSize: '13px', fontWeight: isDone ? '600' : '400',
                                            }}
                                            value={currentMap?.productId || ''}
                                            onChange={e => setMappedItems({ ...mappedItems, [item.name]: { productId: e.target.value, status: 'manual' } })}
                                        >
                                            <option value="">— Stok Kartı Seçin —</option>
                                            {/* Put top suggestions first */}
                                            {(info.suggestions || []).length > 0 && (
                                                <optgroup label={`🤖 AI Önerileri (en iyi ${info.suggestions.length})`}>
                                                    {(info.suggestions as any[]).map((s: any) => (
                                                        <option key={s.product.id} value={s.product.id}>
                                                            {s.product.name} — Stok: {s.product.stock} — Skor: {s.score}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            )}
                                            <optgroup label="📦 Tüm Stok Kartları">
                                                {inventoryProducts.map((inv: any) => (
                                                    <option key={inv.id} value={inv.id}>
                                                        {inv.name} ({inv.stock} Adet)
                                                    </option>
                                                ))}
                                            </optgroup>
                                        </select>
                                    ) : (
                                        /* notFound — offer create */
                                        <div>
                                            {!showCreate ? (
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <select
                                                        style={{ flex: 1, padding: '10px 12px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid rgba(229,62,62,0.4)', color: 'var(--text-main)', fontSize: '13px' }}
                                                        value={currentMap?.productId || ''}
                                                        onChange={e => setMappedItems({ ...mappedItems, [item.name]: { productId: e.target.value, status: 'manual' } })}
                                                    >
                                                        <option value="">— Manuel Seçim Yap —</option>
                                                        {inventoryProducts.map((inv: any) => (
                                                            <option key={inv.id} value={inv.id}>{inv.name} ({inv.stock} Adet)</option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={() => setQuickCreate({ ...quickCreate, [item.name]: { name: item.name, code: item.code || '', stock: '0', price: '0' } })}
                                                        style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(36,123,254,0.4)', background: 'rgba(36,123,254,0.1)', color: '#247BFE', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                                        + Yeni Kart Oluştur
                                                    </button>
                                                </div>
                                            ) : (
                                                /* Quick-create form */
                                                <div style={{ background: 'rgba(36,123,254,0.06)', border: '1px solid rgba(36,123,254,0.2)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#247BFE', marginBottom: '4px' }}>🆕 Yeni Stok Kartı</div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                                                        <div>
                                                            <label style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Ürün Adı *</label>
                                                            <input type="text" value={quickCreate[item.name]!.name}
                                                                onChange={e => setQuickCreate({ ...quickCreate, [item.name]: { ...quickCreate[item.name]!, name: e.target.value } })}
                                                                style={{ width: '100%', padding: '9px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-main)', fontSize: '13px' }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Ürün Kodu</label>
                                                            <input type="text" value={quickCreate[item.name]!.code}
                                                                onChange={e => setQuickCreate({ ...quickCreate, [item.name]: { ...quickCreate[item.name]!, code: e.target.value } })}
                                                                style={{ width: '100%', padding: '9px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-main)', fontSize: '13px' }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                        <div>
                                                            <label style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Mevcut Stok</label>
                                                            <input type="number" value={quickCreate[item.name]!.stock}
                                                                onChange={e => setQuickCreate({ ...quickCreate, [item.name]: { ...quickCreate[item.name]!, stock: e.target.value } })}
                                                                style={{ width: '100%', padding: '9px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-main)', fontSize: '13px' }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Fiyat (₺)</label>
                                                            <input type="number" value={quickCreate[item.name]!.price}
                                                                onChange={e => setQuickCreate({ ...quickCreate, [item.name]: { ...quickCreate[item.name]!, price: e.target.value } })}
                                                                style={{ width: '100%', padding: '9px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-main)', fontSize: '13px' }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                                                        <button onClick={() => handleCreateProduct(item.name, quickCreate[item.name]!)}
                                                            disabled={isCreating === item.name}
                                                            style={{ flex: 1, padding: '10px', borderRadius: '10px', background: '#247BFE', border: 'none', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                                                            {isCreating === item.name ? '⌛ Oluşturuluyor...' : '✅ Stok Kartı Oluştur ve Eşleştir'}
                                                        </button>
                                                        <button onClick={() => setQuickCreate({ ...quickCreate, [item.name]: null })}
                                                            style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--border-light)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px' }}>
                                                            İptal
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Finalize button */}
                        <button
                            onClick={finalizeInvoice}
                            disabled={isLoadingMapping || !allMapped}
                            style={{
                                padding: '16px', borderRadius: '14px', fontWeight: '800', fontSize: '15px', cursor: allMapped ? 'pointer' : 'not-allowed',
                                background: allMapped ? 'linear-gradient(135deg, #247BFE 0%, #6260FE 100%)' : 'rgba(255,255,255,0.08)',
                                color: allMapped ? 'white' : 'var(--text-muted)',
                                border: 'none', marginTop: '8px', transition: 'all 0.2s',
                                boxShadow: allMapped ? '0 8px 24px rgba(36,123,254,0.35)' : 'none',
                            }}>
                            {isLoadingMapping ? '⌛ İŞLENİYOR...' : (allMapped ? '✅ KAYDET VE FATURAYI OLUŞTUR' : `⚠️ Lütfen Tüm Ürünleri Eşleştirin (${selectedOrder.items.filter((i: any) => !mappedItems[i.name]?.productId).length} eksik)`)}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
