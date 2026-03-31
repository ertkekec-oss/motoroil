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
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[1100]">
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 shadow-2xl rounded-[24px] w-full max-w-[800px] max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                
                {/* HEAD */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-[48px] h-[48px] bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-[14px] flex items-center justify-center text-[24px]">📄</div>
                        <div>
                            <h2 className="text-[18px] font-black tracking-tight text-slate-800 dark:text-white m-0">Akıllı Fatura Yükleme</h2>
                            <p className="text-[12px] font-medium text-slate-500 m-0 mt-0.5">Pdf formatındaki e-Fatura / İrsaliyeleri okuyarak envantere aktarır</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 transition-colors text-[24px]">&times;</button>
                </div>

                {/* BODY */}
                <div className="p-6 overflow-y-auto flex-1 custom-scroll">
                    {!invoiceData && !isParsing && (
                        <div 
                            className="border-2 border-dashed border-slate-300 dark:border-white/20 rounded-[16px] py-[60px] px-5 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
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
                            <div className="text-[48px] mb-4">📤</div>
                            <h3 className="text-[18px] font-black text-slate-800 dark:text-white mb-2">Fatura Seç veya Sürükle Bırak</h3>
                            <p className="text-[13px] font-medium text-slate-500">(Yalnızca .pdf Fatura veya İrsaliye dökümanları)</p>
                        </div>
                    )}

                    {isParsing && (
                        <div className="py-[60px] px-5 text-center">
                            <div className="text-[48px] mb-4 animate-spin">⏳</div>
                            <h3 className="text-[18px] font-black text-slate-800 dark:text-white mb-2">Yapay Zeka Faturayı Okuyor...</h3>
                            <p className="text-[13px] font-medium text-slate-500">Ürünler, fiyatlar ve miktarlar eşleştiriliyor.</p>
                        </div>
                    )}

                    {invoiceData && !isParsing && (
                        <div className="flex flex-col gap-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-[16px] border border-slate-100 dark:border-white/5">
                                <div>
                                    <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">Fatura Numarası</label>
                                    <input type="text" value={invoiceData.invoiceNo} onChange={e => setInvoiceData({...invoiceData, invoiceNo: e.target.value})} className="w-full h-[42px] px-3 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[10px] text-[14px] font-bold text-slate-800 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-colors" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">Fatura Tarihi</label>
                                    <input type="date" value={invoiceData.date} onChange={e => setInvoiceData({...invoiceData, date: e.target.value})} className="w-full h-[42px] px-3 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[10px] text-[14px] font-bold text-slate-800 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-colors" />
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-[15px] font-black text-slate-800 dark:text-white m-0">Tespit Edilen Kalemler</h4>
                                    <span className="text-[12px] font-bold text-slate-500">{invoiceData.items.length} Kalem</span>
                                </div>
                                
                                {invoiceData.items.length === 0 ? (
                                    <div className="p-6 text-center bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-[12px] text-red-600 dark:text-red-400 font-semibold text-[13px]">
                                        Otomatik ürün tespiti yapılamadı. Fatura okunamayacak kadar karmaşık veya PDF içeriği şifreli olabilir.
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto custom-scroll pr-1">
                                        {invoiceData.items.map((item, idx) => (
                                            <div key={idx} className="p-3 bg-white dark:bg-slate-800/50 rounded-[12px] border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row shadow-sm items-start sm:items-center gap-3">
                                                <div style={{ flex: 1 }}>
                                                    <input 
                                                        value={item.name} 
                                                        onChange={e => handleUpdateItem(idx, 'name', e.target.value)}
                                                        className="w-full px-2 py-1 bg-transparent border-b border-dashed border-slate-300 dark:border-white/20 text-slate-800 dark:text-white text-[14px] font-black focus:outline-none focus:border-blue-500" 
                                                    />
                                                    <div className="flex flex-wrap items-center gap-3 mt-2">
                                                        <input 
                                                            value={item.code} 
                                                            onChange={e => handleUpdateItem(idx, 'code', e.target.value)}
                                                            placeholder="Stok Kodu"
                                                            className="w-[120px] px-2 py-1.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 text-[11px] font-bold rounded-[6px] outline-none" 
                                                        />
                                                        <span className="text-[11px] font-semibold text-slate-500">Sistem karşılığı yoksa otomatik eklenecektir.</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-0">
                                                    <input 
                                                        type="number" 
                                                        value={item.qty} 
                                                        onChange={e => handleUpdateItem(idx, 'qty', parseFloat(e.target.value) || 0)}
                                                        className="w-[60px] h-[32px] px-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-[8px] font-bold text-center outline-none focus:border-blue-500" 
                                                    />
                                                    <span className="text-[12px] font-bold text-slate-500">{item.unit || 'Adet'}</span>
                                                    <span className="text-[12px] font-bold text-slate-400">x</span>
                                                    <input 
                                                        type="number" 
                                                        value={item.price} 
                                                        onChange={e => handleUpdateItem(idx, 'price', parseFloat(e.target.value) || 0)}
                                                        className="w-[80px] h-[32px] px-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-[8px] font-bold text-right outline-none focus:border-blue-500" 
                                                    />
                                                    <span className="text-[14px] font-black text-blue-600 dark:text-blue-400 min-w-[80px] text-right">{(item.total).toLocaleString()} ₺</span>
                                                    <button onClick={() => handleRemoveItem(idx)} className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-[20px]">&times;</button>
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
                    <div className="px-6 py-5 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row justify-between items-center gap-4 rounded-b-[24px]">
                        <div>
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-1">Genel Toplam (Tedarikçi Borcu)</span>
                            <span className="text-[24px] font-black text-blue-600 dark:text-blue-400 tracking-tight">{invoiceData.totalAmount.toLocaleString()} ₺</span>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button onClick={handleReset} className="flex-1 sm:flex-none px-5 h-[44px] rounded-[10px] text-[13px] font-bold text-slate-700 bg-white dark:bg-[#0f172a] dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">Faturayı Değiştir</button>
                            <button 
                                onClick={handleSave} 
                                disabled={isSaving || invoiceData.items.length === 0}
                                className="flex-1 sm:flex-none px-6 h-[44px] rounded-[10px] text-[13px] font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
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
