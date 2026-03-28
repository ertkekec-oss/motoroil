"use client";

import { useState, useRef } from 'react';
import { useModal } from '@/contexts/ModalContext';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplierId: string;
    supplierName: string;
    onSuccess?: () => void;
}

export default function SupplierInvoiceUploadModal({ isOpen, onClose, supplierId, supplierName, onSuccess }: UploadModalProps) {
    const { showSuccess, showError, showWarning } = useModal();
    const [file, setFile] = useState<File | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Parsed State
    const [invoiceData, setInvoiceData] = useState<{
        invoiceNo: string;
        date: string;
        totalAmount: number;
        items: any[];
    } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type !== 'application/pdf') {
                showWarning('Hatalı Format', 'Lütfen sadece PDF dosyası yükleyin.');
                return;
            }
            setFile(selectedFile);
            await parseInvoice(selectedFile);
        }
    };

    const parseInvoice = async (pdfFile: File) => {
        setIsParsing(true);
        try {
            const formData = new FormData();
            formData.append('file', pdfFile);

            const res = await fetch(`/api/suppliers/${supplierId}/invoice/parse`, {
                method: 'POST',
                body: formData
            });

            let data;
            try {
                data = await res.json();
            } catch (jsonErr) {
                console.error("Non-JSON response from server:", await res.text().catch(() => ""));
                showError('Hata', 'Sunucu yanıtı okunamadı (Sunucu hatası). Lütfen daha küçültülmüş bir PDF ile tekrar deneyin.');
                return;
            }

            if (data.success && data.parsedData) {
                setInvoiceData(data.parsedData);
                showSuccess('Başarılı', `Fatura başarıyla okundu. ${data.parsedData.items.length} kalem bulundu.`);
            } else {
                showError('Hata', data.error || 'Fatura okunamadı.');
            }
        } catch (e: any) {
            console.error(e);
            showError('Hata', 'Fatura işlenirken bir sorun oluştu.');
        } finally {
            setIsParsing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSave = async () => {
        if (!invoiceData || invoiceData.items.length === 0) {
            showWarning('Eksik Veri', 'Kaydedilecek fatura kalemi bulunamadı.');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(`/api/suppliers/${supplierId}/invoice/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invoiceData)
            });
            const result = await res.json();

            if (result.success) {
                showSuccess('Başarılı', 'Fatura envantere ve cari hesaba başarıyla işlendi.');
                onClose();
                if (onSuccess) onSuccess();
                else window.location.reload();
            } else {
                showError('Hata', result.error || 'Fatura kaydedilemedi.');
            }
        } catch (e) {
            showError('Hata', 'Kaydetme işlemi sırasında bir hata oluştu.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveItem = (idx: number) => {
        if (!invoiceData) return;
        const newItems = invoiceData.items.filter((_, i) => i !== idx);
        
        // Recalculate total
        const newTotal = newItems.reduce((acc, item) => acc + (item.qty * item.price), 0);
        
        setInvoiceData({ ...invoiceData, items: newItems, totalAmount: newTotal });
    };

    const handleUpdateItem = (idx: number, field: string, value: any) => {
        if (!invoiceData) return;
        const newItems = [...invoiceData.items];
        newItems[idx][field] = value;
        
        // Recalculate line total and grand total
        newItems[idx].total = newItems[idx].qty * newItems[idx].price;
        const newTotal = newItems.reduce((acc, item) => acc + (item.total), 0);

        setInvoiceData({ ...invoiceData, items: newItems, totalAmount: newTotal });
    };

    const handleReset = () => {
        setFile(null);
        setInvoiceData(null);
    };

    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
            <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm animate-slide-up" style={{ width: '800px', maxWidth: '95vw', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', borderRadius: '24px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                
                {/* HEAD */}
                <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>📄</div>
                        <div>
                            <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: 'white' }}>Akıllı Fatura Yükleme</h2>
                            <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>Pdf formatındaki e-Fatura / İrsaliyeleri okuyarak envantere aktarır</p>
                        </div>
                    </div>
                    <button style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer' }} onClick={onClose}>&times;</button>
                </div>

                {/* BODY */}
                <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                    {!invoiceData && !isParsing && (
                        <div 
                            style={{ border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '16px', padding: '60px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => {
                                e.preventDefault();
                                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                    const droppedFile = e.dataTransfer.files[0];
                                    if (droppedFile.type === 'application/pdf') {
                                        setFile(droppedFile);
                                        parseInvoice(droppedFile);
                                    } else {
                                        showWarning('Hatalı Format', 'Lütfen sadece PDF dosyası yükleyin.');
                                    }
                                }
                            }}
                        >
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="application/pdf" style={{ display: 'none' }} />
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📤</div>
                            <h3 style={{ color: 'white', marginBottom: '8px' }}>Fatura Seç veya Sürükle Bırak</h3>
                            <p style={{ color: '#888', fontSize: '13px' }}>(Yalnızca .pdf Fatura veya İrsaliye dökümanları)</p>
                        </div>
                    )}

                    {isParsing && (
                        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'spin 2s linear infinite' }}>⏳</div>
                            <h3 style={{ color: 'white', marginBottom: '8px' }}>Yapay Zeka Faturayı Okuyor...</h3>
                            <p style={{ color: '#888', fontSize: '13px' }}>Ürünler, fiyatlar ve miktarlar eşleştiriliyor.</p>
                        </div>
                    )}

                    {invoiceData && !isParsing && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px' }}>Fatura Numarası</label>
                                    <input type="text" value={invoiceData.invoiceNo} onChange={e => setInvoiceData({...invoiceData, invoiceNo: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', color: 'white' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px' }}>Fatura Tarihi</label>
                                    <input type="date" value={invoiceData.date} onChange={e => setInvoiceData({...invoiceData, date: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', color: 'white' }} />
                                </div>
                            </div>
                            
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <h4 style={{ color: 'white', margin: 0 }}>Tespit Edilen Kalemler</h4>
                                    <span style={{ fontSize: '12px', color: '#888' }}>{invoiceData.items.length} Kalem</span>
                                </div>
                                
                                {invoiceData.items.length === 0 ? (
                                    <div style={{ padding: '30px', textAlign: 'center', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', color: '#ef4444' }}>
                                        Otomatik ürün tespiti yapılamadı. Fatura okunamayacak kadar karmaşık veya PDF içeriği şifreli olabilir.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                                        {invoiceData.items.map((item, idx) => (
                                            <div key={idx} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <input 
                                                        value={item.name} 
                                                        onChange={e => handleUpdateItem(idx, 'name', e.target.value)}
                                                        style={{ width: '100%', padding: '6px 8px', background: 'transparent', border: 'none', borderBottom: '1px dashed rgba(255,255,255,0.2)', color: 'white', fontSize: '14px', fontWeight: 'bold' }} 
                                                    />
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                                                        <input 
                                                            value={item.code} 
                                                            onChange={e => handleUpdateItem(idx, 'code', e.target.value)}
                                                            placeholder="Stok Kodu"
                                                            style={{ width: '120px', padding: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#888', fontSize: '11px', borderRadius: '4px' }} 
                                                        />
                                                        <span style={{ fontSize: '11px', color: '#555' }}>Sistem karşılığı yoksa otomatik eklenecektir.</span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <input 
                                                        type="number" 
                                                        value={item.qty} 
                                                        onChange={e => handleUpdateItem(idx, 'qty', parseFloat(e.target.value) || 0)}
                                                        style={{ width: '60px', padding: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px', textAlign: 'center' }} 
                                                    />
                                                    <span style={{ fontSize: '12px', color: '#888' }}>{item.unit || 'Adet'}</span>
                                                    <span style={{ fontSize: '12px', color: '#555' }}>x</span>
                                                    <input 
                                                        type="number" 
                                                        value={item.price} 
                                                        onChange={e => handleUpdateItem(idx, 'price', parseFloat(e.target.value) || 0)}
                                                        style={{ width: '80px', padding: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px', textAlign: 'right' }} 
                                                    />
                                                    <span style={{ fontSize: '14px', color: 'white', fontWeight: 'bold', minWidth: '80px', textAlign: 'right' }}>{(item.total).toLocaleString()} ₺</span>
                                                    <button onClick={() => handleRemoveItem(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px', padding: '0 8px' }}>&times;</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    )}
                </div>

                {/* FOOTER */}
                {invoiceData && (
                    <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
                        <div>
                            <span style={{ fontSize: '12px', color: '#888', display: 'block' }}>Genel Toplam (Tedarikçi Borcu)</span>
                            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>{invoiceData.totalAmount.toLocaleString()} ₺</span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={handleReset} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid #555', color: 'white', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>Faturayı Değiştir</button>
                            <button 
                                onClick={handleSave} 
                                disabled={isSaving || invoiceData.items.length === 0}
                                style={{ padding: '12px 32px', background: '#3b82f6', border: 'none', color: 'white', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', opacity: (isSaving || invoiceData.items.length === 0) ? 0.5 : 1, boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)' }}
                            >
                                {isSaving ? 'İşleniyor...' : 'KAYDI TAMAMLA & ENVANTERE EKLE'}
                            </button>
                        </div>
                    </div>
                )}
                
            </div>
        </div>
    );
}
