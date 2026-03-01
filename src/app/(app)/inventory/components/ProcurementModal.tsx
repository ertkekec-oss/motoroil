
import React, { useState } from 'react';
import { Product } from '@/contexts/AppContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ProcurementModalProps {
    isOpen: boolean;
    onClose: () => void;
    products: Product[];
}

export default function ProcurementModal({ isOpen, onClose, products }: ProcurementModalProps) {
    const criticalItems = products.filter(p => (p.stock || 0) <= (p.minStock || 5));
    const [selectedIds, setSelectedIds] = useState<(number | string)[]>(criticalItems.map(p => p.id));
    const [targetQuantities, setTargetQuantities] = useState<Record<string | number, number>>(
        criticalItems.reduce((acc, p) => {
            // Suggest ordering enough to reach minStock + 10 or similar
            const suggest = Math.max(0, (p.minStock || 5) * 2 - (p.stock || 0));
            acc[p.id] = suggest;
            return acc;
        }, {} as Record<string | number, number>)
    );

    if (!isOpen) return null;

    const handleExportExcel = () => {
        const data = criticalItems
            .filter(p => selectedIds.includes(p.id))
            .map(p => ({
                'Ürün Kodu': p.code,
                'Barkod': p.barcode,
                'Ürün Adı': p.name,
                'Marka': p.brand,
                'Kategori': p.category,
                'Mevcut Stok': p.stock,
                'Kritik Seviye': p.minStock,
                'Sipariş Miktarı': targetQuantities[p.id] || 0,
                'Tedarikçi': p.supplier || 'Belirtilmemiş'
            }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Tedarik Listesi");
        XLSX.writeFile(wb, `Tedarik_Listesi_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();

        // Add font support for Turkish characters if needed (default fonts often fail with Turkish chars)
        // For simplicity, we'll try to use standard ASCII or just hope for the best, 
        // but robust Turkish support usually requires adding a custom font.
        // We will stick to basic display for now.

        doc.setFontSize(18);
        doc.text("Tedarik Planlama Listesi", 14, 22);

        doc.setFontSize(11);
        doc.text(`Olusturma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 14, 30);

        const tableData = criticalItems
            .filter(p => selectedIds.includes(p.id))
            .map(p => [
                p.code,
                p.name, // Note: Turkish chars might be an issue without custom font
                p.brand || '-',
                String(p.stock || 0),
                String(p.minStock || 5),
                String(targetQuantities[p.id] || 0),
                p.supplier || '-'
            ]);

        autoTable(doc, {
            head: [['Kod', 'Urun Adi', 'Marka', 'Stok', 'Kritik', 'Siparis', 'Tedarikci']],
            body: tableData,
            startY: 40,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [66, 66, 66] }
        });

        doc.save(`Tedarik_Listesi_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const toggleSelect = (id: string | number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const updateQty = (id: string | number, val: number) => {
        setTargetQuantities(prev => ({ ...prev, [id]: val }));
    };

    return (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-5xl bg-white dark:bg-[#0f172a] rounded-[24px] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50/50 dark:bg-[#1e293b]/50 shrink-0">
                    <div>
                        <h2 className="text-[20px] font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="text-[24px]">📋</span> Tedarik Planlayıcı
                        </h2>
                        <p className="text-[13px] text-slate-500 font-medium mt-1">Kritik seviyeleri normalize etmek için ürün seçin</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 transition-colors">✕</button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scroll relative">
                    {criticalItems.length === 0 ? (
                        <div className="py-24 flex flex-col items-center justify-center text-center opacity-70">
                            <span className="text-5xl block mb-4">✨</span>
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-[15px]">Tüm stoklar güvenli seviyede.</p>
                        </div>
                    ) : (
                        <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-[#0f172a]">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-[#1e293b] border-b border-slate-200 dark:border-white/10">
                                    <tr className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        <th className="px-5 py-3 w-12 text-center"></th>
                                        <th className="px-5 py-3">Ürün Bilgisi</th>
                                        <th className="px-5 py-3 text-center">Mevcut</th>
                                        <th className="px-5 py-3 text-center">Kritik</th>
                                        <th className="px-5 py-3 text-center">Önerilen</th>
                                        <th className="px-5 py-3 w-40 text-center">Sipariş Miktarı</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {criticalItems.map(p => (
                                        <tr key={p.id} className={`transition-colors hover:bg-slate-50/50 dark:hover:bg-white/5 ${selectedIds.includes(p.id) ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                                            <td className="px-5 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(p.id)}
                                                    onChange={() => toggleSelect(p.id)}
                                                    className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">{p.name}</span>
                                                    <span className="text-[11px] text-slate-500 font-medium mt-0.5">{p.code} • {p.brand}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <span className={`text-[13px] font-bold ${p.stock <= 0 ? 'text-red-500' : 'text-amber-500'}`}>{p.stock}</span>
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <span className="text-[13px] font-medium text-slate-500">{p.minStock || 5}</span>
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <span className="text-[13px] font-bold text-emerald-500">+{Math.max(0, (p.minStock || 5) * 2 - (p.stock || 0))}</span>
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <div className="flex justify-center items-center gap-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={targetQuantities[p.id] || 0}
                                                        onChange={(e) => updateQty(p.id, parseInt(e.target.value) || 0)}
                                                        className="w-20 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-lg p-2 text-center text-[13px] font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none shadow-sm transition-shadow"
                                                    />
                                                    <span className="text-[10px] font-semibold text-slate-400">Adet</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e293b] flex justify-between items-center shrink-0">
                    <div className="flex flex-col">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Planlanan Kalem Sayısı</span>
                        <span className="text-[16px] font-bold text-slate-900 dark:text-white">{selectedIds.length} Ürün</span>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-[12px] bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 text-[13px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors shadow-sm"
                        >
                            Vazgeç
                        </button>
                        <button
                            onClick={handleExportPDF}
                            disabled={selectedIds.length === 0}
                            className="px-6 py-2.5 rounded-[12px] bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 font-semibold text-[13px] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                        >
                            📄 PDF İndir
                        </button>
                        <button
                            onClick={handleExportExcel}
                            disabled={selectedIds.length === 0}
                            className="px-8 py-2.5 rounded-[12px] bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[13px] transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                        >
                            📥 Excel İndir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
