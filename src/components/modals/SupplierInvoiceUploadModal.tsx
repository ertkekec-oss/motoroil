"use client";

import { useState, useRef, useEffect } from 'react';
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

    // Operational Override State
    const [invoiceType, setInvoiceType] = useState('NORMAL'); // 'NORMAL' | 'RETURN'
    const [isExpense, setIsExpense] = useState(false);
    const [customDueDate, setCustomDueDate] = useState('');
    const [notes, setNotes] = useState('');
    const [matchedWaybillId, setMatchedWaybillId] = useState('');
    const [pendingWaybills, setPendingWaybills] = useState<any[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Simulate fetching pending waybills
        if (isOpen && supplierId) {
            setPendingWaybills([]); // "Sistemde açık irsaliye bulunamadı" simulasyonu
        }
    }, [isOpen, supplierId]);

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
                // Also reset operational fields
                setCustomDueDate('');
                setIsExpense(false);
                setNotes('');
                setInvoiceType('NORMAL');
                showSuccess('Başarılı', `Fatura başarıyla okundu. ${data.parsedData.items.length} kalem bulundu. Lütfen onay formunu doldurun.`);
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
            const payload = {
                ...invoiceData,
                // Append Operational Settings
                type: invoiceType,
                isExpense,
                customDueDate,
                notes,
                matchedWaybillId
            };

            const res = await fetch(`/api/suppliers/${supplierId}/invoice/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();

            if (result.success) {
                showSuccess('Başarılı', 'Fatura ERP sistemine ve Global Takvime başarıyla işlendi.');
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

    const handleReset = () => {
        setFile(null);
        setInvoiceData(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[1100]">
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 shadow-2xl rounded-[24px] w-full max-w-[1000px] max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                
                {/* HEAD */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                    <div className="flex items-center gap-4">
                        <div className="w-[48px] h-[48px] bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-[14px] flex items-center justify-center text-[24px]">📄</div>
                        <div>
                            <h2 className="text-[18px] font-black tracking-tight text-slate-800 dark:text-white m-0">Fatura Kabul & Doğrulama Sistemi</h2>
                            <p className="text-[12px] font-medium text-slate-500 m-0 mt-0.5">Yapay zeka analizli fatura kabulu ve Global Takvim vadelendirmesi</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 transition-colors text-[24px]">&times;</button>
                </div>

                {/* BODY (SCROLLABLE) */}
                <div className="p-6 overflow-y-auto flex-1 custom-scroll bg-slate-50/30 dark:bg-[#0f172a]">
                    {!invoiceData && !isParsing && (
                        <div 
                            className="border-2 border-dashed border-slate-300 dark:border-white/20 rounded-[16px] py-[80px] px-5 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-all bg-white dark:bg-slate-800/20"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => {
                                e.preventDefault();
                                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                    const droppedFile = e.dataTransfer.files[0];
                                    if (droppedFile.type === 'application/pdf') parseInvoice(droppedFile);
                                    else showWarning('Hatalı Format', 'Lütfen sadece PDF dosyası yükleyin.');
                                }
                            }}
                        >
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="application/pdf" style={{ display: 'none' }} />
                            <div className="text-[54px] mb-4">📥</div>
                            <h3 className="text-[20px] font-black text-slate-800 dark:text-white mb-2">Tedarikçi Faturası Seç veya Sürükle Bırak</h3>
                            <p className="text-[14px] font-medium text-slate-500">Sistem içerisindeki tüm kalemleri, vergi bilgilerini ve tutarları otomatik tarayacaktır.</p>
                        </div>
                    )}

                    {isParsing && (
                        <div className="py-[100px] px-5 text-center">
                            <div className="text-[54px] mb-4 animate-spin">⏳</div>
                            <h3 className="text-[20px] font-black text-slate-800 dark:text-white mb-2">Yapay Zeka Faturayı Analiz Ediyor...</h3>
                            <p className="text-[14px] font-medium text-slate-500">Bu işlem PDF boyutuna göre birkaç saniye sürebilir.</p>
                        </div>
                    )}

                    {invoiceData && !isParsing && (
                        <div className="flex flex-col lg:flex-row gap-6">
                            
                            {/* LEFT SIDE: PREVIEW & READONLY */}
                            <div className="lg:w-[45%] flex flex-col gap-4">
                                <div className="bg-white dark:bg-slate-800 rounded-[16px] border border-slate-200 dark:border-white/10 p-5 shadow-sm">
                                    <h4 className="text-[13px] font-black tracking-widest text-slate-400 uppercase mb-4 flex items-center gap-2">
                                        <span className="text-[16px]">🔒</span> YASAL KİLİTLİ ALANLAR (PDF GÖRÜNÜMÜ)
                                    </h4>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Tedarikçi</label>
                                            <div className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[8px] text-[14px] font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                                                <span>{supplierName}</span>
                                                <span className="text-[16px] cursor-not-allowed opacity-50">🔒</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Fatura (Belge) No</label>
                                            <div className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[8px] text-[14px] font-bold text-slate-600 dark:text-slate-400 font-mono tracking-wide flex items-center justify-between">
                                                <span>{invoiceData.invoiceNo || 'TANIMSIZ'}</span>
                                                <span className="text-[16px] cursor-not-allowed opacity-50">🔒</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Fatura Düzenlenme Tarihi</label>
                                            <div className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[8px] text-[14px] font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                                                <span>{new Date(invoiceData.date || new Date().toISOString()).toLocaleDateString('tr-TR')}</span>
                                                <span className="text-[16px] cursor-not-allowed opacity-50">🔒</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
                                         <h5 className="text-[12px] font-bold text-slate-500 mb-3 flex items-center justify-between">
                                             <span>Fatura Kalemleri ({invoiceData.items.length})</span>
                                             <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded uppercase tracking-wider">Salt Okunur</span>
                                         </h5>
                                         <div className="max-h-[160px] overflow-y-auto custom-scroll pr-1 flex flex-col gap-2">
                                            {invoiceData.items.map((item, idx) => (
                                                <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-[8px] border border-slate-100 dark:border-white/5 flex flex-col">
                                                    <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300 line-clamp-1" title={item.name}>{item.name}</span>
                                                    <div className="flex justify-between items-center mt-1">
                                                        <span className="text-[11px] font-medium text-slate-500">{item.qty} {item.unit || 'Adet'} x {item.price} ₺</span>
                                                        <span className="text-[12px] font-black text-slate-800 dark:text-white">{item.total.toLocaleString()} ₺</span>
                                                    </div>
                                                </div>
                                            ))}
                                         </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT SIDE: OPERATIONAL SETTINGS */}
                            <div className="lg:w-[55%] flex flex-col gap-4">
                                <div className="bg-white dark:bg-slate-800 rounded-[16px] border border-blue-200 dark:border-blue-500/30 p-5 shadow-sm shadow-blue-500/5 h-full relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-[120px] -mt-8 -mr-8">⚙️</div>
                                    <h4 className="text-[13px] font-black tracking-widest text-blue-600 dark:text-blue-400 uppercase mb-5 flex items-center gap-2">
                                        <span className="text-[16px]">✏️</span> OPERASYONEL (KULLANICI) AYARLARI
                                    </h4>

                                    <div className="space-y-5 relative z-10">
                                        {/* Row 1 */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest block mb-1">Fatura Tipi</label>
                                                <select 
                                                    value={invoiceType} 
                                                    onChange={e => setInvoiceType(e.target.value)}
                                                    className="w-full h-[42px] px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/20 rounded-[8px] text-[14px] font-semibold text-slate-800 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                                                >
                                                    <option value="NORMAL">Normal Alış Faturası</option>
                                                    <option value="RETURN">İade Alış Faturası</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest block mb-1">📅 Sizin Vade Tarihiniz</label>
                                                <input 
                                                    type="date" 
                                                    value={customDueDate} 
                                                    onChange={e => setCustomDueDate(e.target.value)}
                                                    className="w-full h-[42px] px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/20 rounded-[8px] text-[14px] font-semibold text-slate-800 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                                                />
                                                <p className="text-[10px] text-slate-500 mt-1 font-medium">Bu tarih <span className="font-bold text-indigo-600 dark:text-indigo-400">Global Takvim</span> ödemelerine yansır.</p>
                                            </div>
                                        </div>

                                        {/* Row 2: Expense Switch */}
                                        <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-[10px]">
                                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                                <input type="checkbox" className="sr-only peer" checked={isExpense} onChange={e => setIsExpense(e.target.checked)} />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                            </label>
                                            <div>
                                                <h5 className="text-[13px] font-bold text-amber-800 dark:text-amber-400 m-0">Faturayı "Masraf" Olarak İşle</h5>
                                                <p className="text-[11px] font-medium text-amber-700 dark:text-amber-500 m-0 leading-tight mt-0.5">Stok depolarına ürün kaydedilmez. Yalnızca gider / ödeme faturası oluşturulur.</p>
                                            </div>
                                        </div>

                                        {/* Row 3: Waybill Match */}
                                        {!isExpense && (
                                            <div>
                                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest block mb-1">🔗 İrsaliye Eşleştirmesi</label>
                                                <select 
                                                    value={matchedWaybillId} 
                                                    onChange={e => setMatchedWaybillId(e.target.value)}
                                                    className="w-full h-[42px] px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/20 rounded-[8px] text-[13px] font-medium text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-all cursor-pointer"
                                                >
                                                    <option value="">İrsaliye ile eşleştirme yapma (Stokları doğrudan arttır)</option>
                                                    {pendingWaybills.length === 0 && (
                                                        <option value="" disabled>--- Tedarikçiye ait faturası kesilmemiş irsaliye bulunamadı ---</option>
                                                    )}
                                                    {pendingWaybills.map(wb => (
                                                        <option key={wb.id} value={wb.id}>{wb.waybillNo} - {new Date(wb.date).toLocaleDateString()}</option>
                                                    ))}
                                                </select>
                                                <p className="text-[10px] text-slate-500 mt-1 font-medium">İrsaliyeyi eşlerseniz <span className="text-red-500 font-bold">mükerrer stok oluşmaması</span> için stok girmeyip irsaliye durumu Faturaya Çevrildi yapılır.</p>
                                            </div>
                                        )}

                                        {/* Row 4: External Notes */}
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest block mb-1">Ek İç Açıklama / Not</label>
                                            <textarea 
                                                value={notes} 
                                                onChange={e => setNotes(e.target.value)}
                                                placeholder="İç operasyonlar için not ekleyebilirsiniz..."
                                                className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/20 rounded-[8px] text-[13px] font-medium text-slate-800 dark:text-white min-h-[70px] resize-none outline-none focus:border-blue-500 transition-all custom-scroll"
                                            ></textarea>
                                        </div>

                                    </div>
                                </div>
                            </div>

                        </div>
                    )}
                </div>

                {/* FOOTER */}
                {invoiceData && (
                    <div className="px-6 py-5 border-t border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900 rounded-b-[24px] flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-1">Genel Toplam (Resmi Borç)</span>
                            <span className="text-[28px] font-black text-blue-600 dark:text-blue-400 tracking-tighter leading-none">{invoiceData.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button onClick={handleReset} className="flex-1 sm:flex-none px-5 h-[46px] rounded-[12px] text-[13px] font-bold text-slate-700 bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Vazgeç</button>
                            <button 
                                onClick={handleSave} 
                                disabled={isSaving || invoiceData.items.length === 0}
                                className="flex-1 sm:flex-none px-6 h-[46px] rounded-[12px] text-[14px] font-black tracking-wide text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                {isSaving ? <span className="animate-spin">⏳</span> : '🚀'}
                                {isSaving ? 'İşleniyor...' : 'ONAYLA & KAYDI TAMAMLA'}
                            </button>
                        </div>
                    </div>
                )}
                
            </div>
        </div>
    );
}
